import QRCode from 'qrcode'

/** Render locally so private profiles and QR data never need an image service. */
export async function createPoster(options: {
  name: string; greeting: string; avatar: string; url: string; dark: boolean; language: 'zh' | 'en'
}): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080; canvas.height = 1440
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img); img.onerror = reject; img.src = src
  })
  const qr = await load(await QRCode.toDataURL(options.url, { width: 440, margin: 3, errorCorrectionLevel: 'M' }))
  let avatar: HTMLImageElement | undefined
  try { if (options.avatar) avatar = await load(options.avatar) } catch { /* Initials keep export available if an external avatar blocks CORS. */ }
  const dark = options.dark, ink = dark ? '#f1f1f3' : '#24252b', muted = dark ? '#a3a5ad' : '#666872'
  ctx.fillStyle = dark ? '#0c0d10' : '#f1f0ed'; ctx.fillRect(0, 0, 1080, 1440)
  const glow = ctx.createRadialGradient(850, 180, 10, 850, 180, 820)
  glow.addColorStop(0, dark ? '#30323b' : '#ffffff'); glow.addColorStop(1, dark ? '#0c0d1000' : '#ffffff00')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1440)
  ctx.strokeStyle = dark ? '#ffffff12' : '#00000010'; ctx.lineWidth = 1
  for (const radius of [290, 360, 430]) { ctx.beginPath(); ctx.arc(900, 160, radius, 0, Math.PI * 2); ctx.stroke() }
  const font = "Arial, 'PingFang SC', 'Arial Unicode MS', sans-serif"
  const write = (value: string, x: number, y: number, size: number, color = ink, weight = 400) => {
    ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.fillText(value, x, y)
  }
  write('PERSONAL SPACE / 001', 84, 100, 18, muted, 500)
  ctx.save(); ctx.beginPath(); ctx.roundRect(84, 180, 190, 190, 38); ctx.clip()
  ctx.fillStyle = '#fff'; ctx.fillRect(84, 180, 190, 190)
  if (avatar) { const edge = Math.min(avatar.width, avatar.height); ctx.drawImage(avatar, (avatar.width-edge)/2, (avatar.height-edge)/2, edge, edge, 84, 180, 190, 190) }
  else write(options.name.slice(0, 1), 137, 309, 90, '#171717', 700)
  ctx.restore()
  let nameSize = 88
  while (nameSize > 32) { ctx.font = `600 ${nameSize}px ${font}`; if (ctx.measureText(options.name).width <= 912) break; nameSize -= 2 }
  write(options.name, 84, 490, nameSize, ink, 600)
  // Wrap the introduction rather than clipping translated or custom copy.
  ctx.font = `400 31px ${font}`
  let line = '', y = 557
  for (const char of options.greeting) {
    if (ctx.measureText(line + char).width > 880 || char === '\n') { write(line, 84, y, 31, muted); line = ''; y += 44 }
    if (char !== '\n') line += char
  }
  if (line) write(line, 84, y, 31, muted)
  ctx.strokeStyle = dark ? '#ffffff20' : '#00000018'; ctx.beginPath(); ctx.moveTo(84, 675); ctx.lineTo(996, 675); ctx.stroke()
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(84, 752, 400, 400, 28); ctx.fill(); ctx.drawImage(qr, 94, 762, 380, 380)
  write(options.language === 'zh' ? '扫码，认识我。' : 'Scan. Say hello.', 540, 890, 34, ink, 500)
  write(options.language === 'zh' ? '一张名片，保持连接。' : 'One card. Stay connected.', 540, 945, 23, muted)
  write('↗', 540, 1070, 72, muted)
  const host = new URL(options.url).host
  write(host.length > 52 ? host.slice(0, 49) + '…' : host, 84, 1220, 22, muted)
  write('DK CONNECT', 84, 1342, 20, muted, 600)
  write('LESS DISTANCE. MORE CONNECTION.', 580, 1342, 15, muted)
  // Draw raster layers last so they remain crisp over the background.
  ctx.drawImage(qr, 94, 762, 380, 380)
  if (avatar) {
    ctx.save(); ctx.beginPath(); ctx.roundRect(84, 180, 190, 190, 38); ctx.clip()
    const edge = Math.min(avatar.width, avatar.height)
    ctx.drawImage(avatar, (avatar.width-edge)/2, (avatar.height-edge)/2, edge, edge, 84, 180, 190, 190)
    ctx.restore()
  }
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG unavailable')), 'image/png'))
}
