import { createHmac, timingSafeEqual } from 'node:crypto'
import { followUp, greeting, handoff, topics } from '../../chatwoot-bot/replies'
import type { Topic } from '../../chatwoot-bot/replies'

// Subset of the payload Chatwoot sends to Agent Bot webhooks.
interface ChatwootEvent {
  event: string
  id?: number
  content?: string | null
  content_type?: string
  message_type?: string
  private?: boolean
  content_attributes?: { submitted_values?: { value?: string }[] }
  account?: { id: number }
  conversation?: { id: number, status: string }
}

const MAX_SIGNATURE_AGE_SECONDS = 300
const options = [...topics, handoff]

// message_updated also fires for unrelated updates, so each option message is answered once.
const answeredSelections = new Set<number>()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rawBody = await readRawBody(event) ?? ''

  if (!config.chatwootBotToken || !config.public.chatwootBaseUrl) {
    throw createError({ statusCode: 503, statusMessage: 'Chatwoot bot is not configured' })
  }

  if (config.chatwootBotSecret) {
    const timestamp = getHeader(event, 'x-chatwoot-timestamp')
    const signature = getHeader(event, 'x-chatwoot-signature')
    if (!isValidSignature(config.chatwootBotSecret, rawBody, timestamp, signature)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
    }
  }

  const payload = JSON.parse(rawBody) as ChatwootEvent
  const { account, conversation } = payload

  // Once a conversation is handed to staff it is no longer pending, so the bot stays quiet.
  if (!account || !conversation || conversation.status !== 'pending') return { ok: true }

  const chatwoot = createChatwootClient(config.public.chatwootBaseUrl, config.chatwootBotToken, account.id, conversation.id)

  if (payload.event === 'message_created' && payload.message_type === 'incoming' && !payload.private) {
    const typed = payload.content?.trim().toLowerCase()
    const option = options.find(o => o.title.toLowerCase() === typed)
    if (option) await answer(chatwoot, option)
    else await chatwoot.sendMenu(greeting)
  }

  if (payload.event === 'message_updated' && payload.content_type === 'input_select' && payload.id) {
    const value = payload.content_attributes?.submitted_values?.[0]?.value
    const option = options.find(o => o.value === value)
    if (option && !answeredSelections.has(payload.id)) {
      rememberSelection(payload.id)
      await answer(chatwoot, option)
    }
  }

  return { ok: true }
})

async function answer(chatwoot: ReturnType<typeof createChatwootClient>, option: Topic) {
  await chatwoot.sendText(option.reply)

  if (option.value === handoff.value) await chatwoot.openConversation()
  else await chatwoot.sendMenu(followUp)
}

function createChatwootClient(baseUrl: string, token: string, accountId: number, conversationId: number) {
  const conversationUrl = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}`
  const request = (path: string, body: Record<string, unknown>) => $fetch(`${conversationUrl}${path}`, {
    method: 'POST',
    headers: { api_access_token: token },
    body
  })

  return {
    sendText: (content: string) => request('/messages', { content, message_type: 'outgoing' }),
    sendMenu: (content: string) => request('/messages', {
      content,
      message_type: 'outgoing',
      content_type: 'input_select',
      content_attributes: { items: options.map(({ title, value }) => ({ title, value })) }
    }),
    openConversation: () => request('/toggle_status', { status: 'open' })
  }
}

function isValidSignature(secret: string, rawBody: string, timestamp?: string, signature?: string) {
  if (!timestamp || !signature) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > MAX_SIGNATURE_AGE_SECONDS) return false

  const expected = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function rememberSelection(messageId: number) {
  if (answeredSelections.size >= 1000) answeredSelections.clear()
  answeredSelections.add(messageId)
}
