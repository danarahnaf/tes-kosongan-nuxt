// Static auto-reply content for the Chatwoot bot. Edit the texts here.

export interface Topic {
  value: string
  title: string
  reply: string
}

export const greeting = 'Halo! Ada yang bisa kami bantu? Silakan pilih topik di bawah.'

export const followUp = 'Ada lagi yang bisa kami bantu?'

export const topics: Topic[] = [
  {
    value: 'jam_buka',
    title: 'Jam buka',
    reply: [
      'Jam buka kami:',
      '• Senin–Jumat: 08.00–21.00',
      '• Sabtu–Minggu: 09.00–22.00',
      '• Hari libur nasional: 10.00–20.00'
    ].join('\n')
  },
  {
    value: 'menu',
    title: 'Menu makanan',
    reply: [
      'Menu favorit kami:',
      '• Nasi Goreng Spesial – Rp28.000',
      '• Mie Ayam Bakso – Rp25.000',
      '• Ayam Bakar Madu – Rp35.000',
      '• Sate Ayam (10 tusuk) – Rp30.000',
      '• Es Teh Manis – Rp6.000',
      '• Es Jeruk – Rp8.000'
    ].join('\n')
  },
  {
    value: 'lokasi',
    title: 'Lokasi',
    reply: 'Kami berada di Jl. Contoh No. 123, Jakarta. Parkir tersedia di depan restoran.'
  }
]

export const handoff: Topic = {
  value: 'staf',
  title: 'Bicara dengan staf',
  reply: 'Baik, kami hubungkan dengan staf kami. Mohon tunggu sebentar.'
}
