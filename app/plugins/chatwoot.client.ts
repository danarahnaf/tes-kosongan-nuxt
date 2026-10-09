declare global {
  interface Window {
    chatwootSDK?: {
      run: (options: { websiteToken: string, baseUrl: string }) => void
    }
  }
}

export default defineNuxtPlugin(() => {
  const { chatwootBaseUrl: baseUrl, chatwootWebsiteToken: websiteToken } = useRuntimeConfig().public

  if (!baseUrl || !websiteToken) return

  const script = document.createElement('script')
  script.src = `${baseUrl}/packs/js/sdk.js`
  script.async = true
  script.onload = () => {
    window.chatwootSDK?.run({ websiteToken, baseUrl })
  }
  document.head.appendChild(script)
})
