<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import Icon from './Icon.vue'
import { getCardZone, surfacePoint, type CardZone } from './cardGeometry'
import { createPoster } from './poster'
import { config, type Language, type Localized, type SocialCard } from './config'
const language = ref<Language>(config.language)
const theme = ref<'dark' | 'light'>(config.theme)
const text = (value: Localized) => typeof value === 'string' ? value : value[language.value]
const words = {
  zh: { poster: '保存分享海报', creating: '正在绘制海报…', download: '下载海报', posterError: '海报生成失败，请重试', localPreview: '当前为本地预览，二维码只能在这台设备上打开；正式上线后再分享。', linkCopied: '链接已复制', home: '个人名片', language: '切换到英文', theme: '切换到', light: '浅色模式', dark: '深色模式', share: '分享名片', hello: '你好，我是', connect: '从这里，开始连接。', contact: '联系我', explore: '认识我', section: '我的数字坐标', hint: '选择你习惯的方式，打个招呼吧。', visit: '前往', details: '查看', viewQr: '查看二维码', pending: '即将连接', copy: '复制账号', copied: '已复制', failed: '复制失败，请长按文字手动复制', shareTitle: '让下一次相遇，更简单。', shareBody: '一张名片，连接我的数字世界。', qr: '名片二维码', scan: '扫码打开名片，或复制链接分享。', copyLink: '复制名片链接', hoverCopy: '点击复制名片链接', revealShare: '点击翻转名片', close: '关闭', unset: '联系方式即将上线', unsetBody: '这里还没有公开账号，欢迎稍后再来看看。', manual: '复制账号后，在对应平台搜索添加。', qrFail: '二维码暂时无法生成，请复制链接。', footer: '保持好奇，保持连接。', card: '数字身份', available: '开放连接', back: '返回顶部' },
  en: { poster: 'Save share poster', creating: 'Creating your poster…', download: 'Download poster', posterError: 'Could not create poster. Please retry.', localPreview: 'Local preview: this QR only opens on this device. Share after publishing.', linkCopied: 'Link copied', home: 'Personal card', language: 'Switch to Chinese', theme: 'Switch to ', light: 'light mode', dark: 'dark mode', share: 'Share card', hello: 'Hello, I’m', connect: 'Good things start with a hello.', contact: 'Let’s connect', explore: 'Meet me', section: 'Find me around the internet', hint: 'Pick your favorite place. Say hello.', visit: 'Open', details: 'View', viewQr: 'View QR code', pending: 'Coming soon', copy: 'Copy account', copied: 'Copied', failed: 'Could not copy. Select the text to copy manually.', shareTitle: 'One card. A world of connections.', shareBody: 'A little shortcut to my digital world.', qr: 'Card QR code', scan: 'Scan to open my card, or copy the link to share.', copyLink: 'Copy card link', hoverCopy: 'Click to copy card link', revealShare: 'Click to flip card', close: 'Close', unset: 'Coming soon', unsetBody: 'No account is public here yet. Drop by again soon.', manual: 'Copy the account and search for it in the app.', qrFail: 'QR code unavailable. You can still copy the link.', footer: 'Stay curious. Stay connected.', card: 'Digital identity', available: 'Open to connect', back: 'Back to top' },
}
const t = computed(() => words[language.value])
const selected = ref<SocialCard | null>(null)
const shareOpen = ref(false)
const modalOpen = computed(() => Boolean(selected.value || shareOpen.value))
const qrData = ref('')
const qrFailed = ref(false)
const toast = ref('')
const shareUrl = config.publicUrl || window.location.href.split('#')[0]
const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(shareUrl).hostname)
const modal = ref<HTMLElement>()
const identity = ref<HTMLElement>()
const stack = ref<HTMLElement>()
const pressure = ref<HTMLElement>()
const entryTravel = ref<HTMLElement>()
const heroCopy = ref<HTMLElement>()
const topbar = ref<HTMLElement>()
let textRevealStart: number | undefined
function revealPassedText(progress: number) {
  const copy = heroCopy.value
  const plane = pressure.value
  if (!copy || !plane) return
  const textRect = copy.getBoundingClientRect()
  const cardRect = plane.getBoundingClientRect()
  const desktop = window.innerWidth > 760
  const visible = Math.max(0, Math.min(textRect.width, cardRect.left - textRect.left - 50))
  copy.style.setProperty('--copy-revealed', `${visible}px`)
  if (textRevealStart === undefined && (desktop ? visible > 0 : progress >= .2)) textRevealStart = progress
  const start = textRevealStart ?? 1
  for (const [selector, delay] of [['.copy-wipe', 0], ['.copy-fade', .24]] as const) {
    copy.querySelectorAll<HTMLElement>(selector).forEach((line, index) => {
      const t = Math.max(0, Math.min(1, (progress - start - delay - index * .035) / .17))
      line.style.setProperty('--passed-alpha', `${t * t * (3 - 2 * t)}`)
    })
  }
}
const stackOpen = ref(false)
const stackUsed = ref(false)
const stackPressed = ref(false)
const turnX = ref(0)
const turnY = ref(0)
const turning = ref(false)
const hoverZone = ref<CardZone>('right')
const coreLayers = [-2.4, -1.2, 0, 1.2, 2.4]
const entering = ref(true)
const entranceReady = ref(false)
let entranceStartFrame = 0
const orbitStartOne = ref(`${Math.floor(Math.random() * 360)}deg`)
const orbitStartTwo = ref(`${Math.floor(Math.random() * 360)}deg`)
let flipTimer: ReturnType<typeof setTimeout> | undefined
const flipHint = computed(() => {
  const hints = language.value === 'zh'
    ? { top: '点击翻转上沿', bottom: '点击翻转下沿', left: '点击向左翻', right: '点击向右翻', none: '移到上下或左右边缘翻转' }
    : { top: 'Flip from the top', bottom: 'Flip from the bottom', left: 'Flip left', right: 'Flip right', none: 'Move to an edge to flip' }
  return hints[hoverZone.value]
})
function cardZone(clientX: number, clientY: number): CardZone {
  const rect = stack.value?.closest('.float-anchor')?.getBoundingClientRect()
  if (!rect) return 'right'
  const x = (clientX - rect.left) / rect.width, y = (clientY - rect.top) / rect.height
  return getCardZone(x, y)
}
function finishEntrance() {
  if (!entering.value) return
  // Keep the completed revolution as the interaction baseline, avoiding a reverse unwind.
  turnX.value = 0
  turnY.value = 360
  stackOpen.value = false
  entering.value = false
  if (mouseInside && pointerPosition) {
    stackPressed.value = true
    hoverZone.value = cardZone(pointerPosition.x, pointerPosition.y)
    applyPointerTilt(pointerPosition.x, pointerPosition.y)
    if (!lightFrame) lightFrame = requestAnimationFrame(updateSurfaceLights)
  }
}
function resetCard() {
  clearTimeout(flipTimer)
  turning.value = false
  turnX.value = 0; turnY.value = 0; stackOpen.value = false
  leaveStack()
}
const stackQr = ref('')
const stackQrFailed = ref(false)
const cursorHint = ref(false)
const cursor = ref({ x: 0, y: 0 })
let hoverTimer: ReturnType<typeof setTimeout> | undefined
let mouseInside = false
let lastPointerType = 'mouse'
let lightFrame = 0
let pointerPosition: { x: number; y: number } | null = null
function updateSurfaceLights() {
  if (!mouseInside || !pointerPosition) { lightFrame = 0; return }
  const faces = stack.value?.querySelectorAll<HTMLElement>('.identity-front, .identity-share')
  faces?.forEach(face => {
    const points = Array.from(face.querySelectorAll<HTMLElement>('.surface-probe')).map(probe => {
      const rect = probe.getBoundingClientRect(); return { x: rect.left, y: rect.top }
    })
    if (points.length !== 4) return
    const point = surfacePoint(points, pointerPosition!.x, pointerPosition!.y)
    if (!point) return
    face.style.setProperty('--light-x', `${Math.max(0, Math.min(1, point.x)) * 100}%`)
    face.style.setProperty('--light-y', `${Math.max(0, Math.min(1, point.y)) * 100}%`)
  })
  lightFrame = requestAnimationFrame(updateSurfaceLights)
}
async function prepareStackQr() {
  try { stackQr.value = await QRCode.toDataURL(shareUrl, { margin: 2, width: 360, color: { dark: '#111111', light: '#ffffff' } }) }
  catch { stackQrFailed.value = true }
}
function applyPointerTilt(clientX: number, clientY: number) {
  if (reducedMotion() || !identity.value) return
  const bounds = stack.value?.closest('.float-anchor')?.getBoundingClientRect() || identity.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width))
  const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height))
  stack.value?.style.setProperty('--light-x', `${x * 100}%`)
  stack.value?.style.setProperty('--light-y', `${y * 100}%`)
  stack.value?.style.setProperty('--shadow-x', `${(0.5 - x) * 28}px`)
  stack.value?.style.setProperty('--shadow-y', `${26 + (1 - y) * 18}px`)
  pressure.value?.style.setProperty('--rx', `${Math.max(-13, Math.min(13, (0.5 - y) * 24))}deg`)
  pressure.value?.style.setProperty('--ry', `${Math.max(-15, Math.min(15, (x - 0.5) * 28))}deg`)
}
function moveStack(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  cursor.value = { x: Math.max(12, Math.min(event.clientX + 16, window.innerWidth - 236)), y: Math.min(event.clientY + 22, window.innerHeight - 52) }
  pointerPosition = { x: event.clientX, y: event.clientY }
  if (entering.value) return
  if (!lightFrame) lightFrame = requestAnimationFrame(updateSurfaceLights)
  hoverZone.value = cardZone(event.clientX, event.clientY)
  applyPointerTilt(event.clientX, event.clientY)
}
function enterStack(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  mouseInside = true
  pointerPosition = { x: event.clientX, y: event.clientY }
  if (entering.value) return
  stackPressed.value = true
  moveStack(event)
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => { if (mouseInside) cursorHint.value = true }, 1000)
}
function leaveStack(event?: PointerEvent) {
  if (event && event.pointerType !== 'mouse') return
  mouseInside = false
  pointerPosition = null
  cancelAnimationFrame(lightFrame); lightFrame = 0
  stackPressed.value = false
  clearTimeout(hoverTimer)
  cursorHint.value = false
  resetTilt()
}
function activateStack(event: MouseEvent | KeyboardEvent) {
  if (turning.value || entering.value) return
  let zone: CardZone
  if (event instanceof KeyboardEvent) {
    const keys: Record<string, CardZone> = { ArrowUp: 'top', ArrowDown: 'bottom', ArrowLeft: 'left', ArrowRight: 'right' }
    zone = keys[event.key] || 'right'
  } else zone = cardZone(event.clientX, event.clientY)
  if (zone === 'none') return
  rippleKey.value++
  stackUsed.value = true
  turning.value = true
  // In rotateX(turnX) rotateY(turnY), rotateY rotates around the X-rotated local Y-axis.
  // When turnX is an odd multiple of 180deg, the local Y-axis points downward in screen space,
  // so we invert the Y delta to keep left/right flips aligned with screen direction.
  const xInverted = Math.abs(Math.round(turnX.value / 180)) % 2 === 1
  const ySign = xInverted ? -1 : 1
  if (zone === 'top') turnX.value += 180
  else if (zone === 'bottom') turnX.value -= 180
  else if (zone === 'left') turnY.value -= 180 * ySign
  else turnY.value += 180 * ySign
  stackOpen.value = !stackOpen.value
  hoverZone.value = zone
  if (lastPointerType !== 'mouse') {
    stackPressed.value = false
  }
  flipTimer = setTimeout(() => {
    turning.value = false
    if (mouseInside && pointerPosition) {
      stackPressed.value = true
      applyPointerTilt(pointerPosition.x, pointerPosition.y)
      if (!lightFrame) lightFrame = requestAnimationFrame(updateSurfaceLights)
    } else if (!stack.value?.matches(':focus-visible')) {
      stackPressed.value = false
      resetTilt()
    }
  }, reducedMotion() ? 0 : 560)
}
function focusStack() {
  if (stack.value?.matches(':focus-visible')) stackPressed.value = true
}
function outsideStack(event: PointerEvent) {
  lastPointerType = event.pointerType
  if (!stack.value?.closest('.float-anchor')?.contains(event.target as Node)) leaveStack()
}
let previousFocus: HTMLElement | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const asset = (path: string) => path.startsWith('/') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path
function saveSettings() {
  document.documentElement.dataset.theme = theme.value
  document.documentElement.lang = language.value === 'zh' ? 'zh-CN' : 'en'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.value === 'dark' ? '#0b0c0e' : '#f3f2ef')
  document.title = `${config.name} · Dk Connect`
  try { localStorage.setItem('dk-preferences', JSON.stringify({ theme: theme.value, language: language.value })) } catch { /* Settings are optional on restricted browsers. */ }
}
watch([theme, language], saveSettings)
function startEntrance() {
  cancelAnimationFrame(entranceStartFrame)
  let started: number | undefined
  const frame = (now: number) => {
    const anchor = stack.value?.closest('.float-anchor') as HTMLElement | null
    const travel = entryTravel.value
    if (!anchor || !travel || !stack.value || !entering.value) return
    started ??= now
    const progress = Math.min(1, (now - started) / 1400)
    // Read the stationary anchor, never the already-transformed card. Recompute on
    // every frame so window resizing, zoom and layout changes use current bounds.
    const rect = anchor.getBoundingClientRect()
    const viewport = window.visualViewport
    const viewportLeft = viewport?.offsetLeft ?? 0
    const start = viewportLeft - rect.right - rect.width * .5
    // One continuous flight curve: the screen center is a pass-through point.
    const flight = Math.min(1, progress / .55)
    const distance = flight * flight
    const x = start * (1 - distance)
    // Start turning as the leading edge enters the viewport, rather than at its center.
    const appearanceOffset = viewportLeft - rect.right + rect.width * .08
    const appearanceDistance = Math.max(0, Math.min(1, 1 - appearanceOffset / start))
    const flipStart = .55 * Math.sqrt(appearanceDistance)
    const angle = progress < flipStart ? 0 : progress < .55
      ? 180 * ((progress - flipStart) / (.55 - flipStart))
      : progress < .75 ? 180 : 180 + 180 * Math.pow(Math.min(1, (progress - .75) / .25), 2)
    travel.style.setProperty('--entry-offset', `${x}px`)
    travel.style.setProperty('--entry-rise', '0px')
    travel.style.setProperty('--entry-roll', '0deg')
    stack.value.style.setProperty('--entry-angle', `${angle}deg`)
    revealPassedText(progress)
    const headerT = Math.max(0, Math.min(1, (progress - .72) / .28))
    const headerEase = headerT * headerT * headerT
    if (topbar.value) {
      topbar.value.style.transform = `translateY(${-38 * (1 - headerEase)}px)`
      topbar.value.style.opacity = `${Math.min(1, headerT * 2)}`
    }
    entranceReady.value = true
    if (progress < 1 && !reducedMotion()) entranceStartFrame = requestAnimationFrame(frame)
    else finishEntrance()
  }
  entranceStartFrame = requestAnimationFrame(frame)
}
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('dk-preferences') || '{}')
    if (saved.theme === 'light' || saved.theme === 'dark') theme.value = saved.theme
    if (saved.language === 'zh' || saved.language === 'en') language.value = saved.language
  } catch { /* Use configured defaults. */ }
  saveSettings()
  window.addEventListener('keydown', keydown)
  window.addEventListener('pointerdown', outsideStack)
  void prepareStackQr()
  if (reducedMotion()) {
    entering.value = false
  } else {
    if (document.readyState === 'complete') startEntrance()
    else window.addEventListener('load', startEntrance, { once: true })
  }
  if ('IntersectionObserver' in window && !reducedMotion()) {
    scrollObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in-view'); scrollObserver?.unobserve(entry.target) }
    }, { threshold: 0.12 })
    document.querySelectorAll('.social-card, .share-strip').forEach(el => { el.classList.add('scroll-enter'); scrollObserver?.observe(el) })
  }
})
onBeforeUnmount(() => { window.removeEventListener('load', startEntrance); cancelAnimationFrame(entranceStartFrame); cancelAnimationFrame(lightFrame); clearTimeout(timer); clearTimeout(flipTimer); clearTimeout(hoverTimer); clearTimeout(copyTimer); scrollObserver?.disconnect(); clearPoster(); window.removeEventListener('pointerdown', outsideStack); window.removeEventListener('keydown', keydown); document.body.style.overflow = '' })
watch(modalOpen, async open => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) { previousFocus = document.activeElement as HTMLElement; await nextTick(); modal.value?.querySelector<HTMLButtonElement>('button')?.focus() }
  else previousFocus?.focus()
})
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && (turnX.value || turnY.value)) resetCard()
  if (!modalOpen.value) return
  if (event.key === 'Escape') close()
  if (event.key !== 'Tab') return
  const items = modal.value?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
  if (!items?.length) return
  const first = items[0], last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function notice(value: string) { toast.value = value; clearTimeout(timer); timer = setTimeout(() => toast.value = '', 2600) }
async function copy(value: string) {
  let input: HTMLTextAreaElement | undefined
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value)
    else { input = document.createElement('textarea'); input.value = value; input.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(input); input.select(); if (!document.execCommand('copy')) throw new Error() }
    copiedValue.value = value
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => copiedValue.value = '', 2200)
    notice(value === shareUrl ? t.value.linkCopied : t.value.copied)
  } catch { notice(t.value.failed) } finally { input?.remove() }
}
function openCard(card: SocialCard) { selected.value = card; shareOpen.value = false; qrFailed.value = false; qrData.value = card.qrImage ? asset(card.qrImage) : '' }
async function showShare() {
  selected.value = null; shareOpen.value = true; qrData.value = ''; qrFailed.value = false
  try { const result = await QRCode.toDataURL(shareUrl, { margin: 2, width: 320, color: { dark: '#111111', light: '#ffffff' } }); if (shareOpen.value) qrData.value = result }
  catch { qrFailed.value = true }
}
async function share() {
  if (navigator.share) {
    try { await navigator.share({ title: `${config.name} · Dk Connect`, url: shareUrl }); return }
    catch (error) { if ((error as DOMException).name === 'AbortError') return }
  }
  await showShare()
}
function close() { selected.value = null; shareOpen.value = false; qrData.value = '' }
function resetTilt() { pressure.value?.style.setProperty('--rx', '0deg'); pressure.value?.style.setProperty('--ry', '0deg'); stack.value?.style.setProperty('--light-x', '40%'); stack.value?.style.setProperty('--light-y', '20%') }
const year = new Date().getFullYear()
const copiedValue = ref('')
let copyTimer: ReturnType<typeof setTimeout> | undefined
const rippleKey = ref(0)
const posterUrl = ref('')
const posterBusy = ref(false)
let posterRevision = 0
let scrollObserver: IntersectionObserver | undefined
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
let themeBusy = false
async function toggleTheme(event: MouseEvent) {
  if (themeBusy) return
  const apply = async () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; await nextTick() }
  const doc = document as Document & { startViewTransition?: (callback: () => Promise<void>) => { ready: Promise<void>; finished: Promise<void> } }
  if (!doc.startViewTransition || reducedMotion()) { await apply(); return }
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = bounds.left + bounds.width / 2, y = bounds.top + bounds.height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  themeBusy = true
  document.documentElement.classList.add('theme-transitioning')
  const transition = doc.startViewTransition(apply)
  try {
    await transition.ready
    const animation = document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' })
    await animation.finished
  } catch { /* Unsupported pseudo-element animation still leaves the new theme applied. */ }
  finally { await transition.finished.catch(() => {}); document.documentElement.classList.remove('theme-transitioning'); themeBusy = false }
}
function spotlight(event: PointerEvent) {
  if (reducedMotion()) return
  const el = event.currentTarget as HTMLElement, rect = el.getBoundingClientRect()
  el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
  el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
}
function clearPoster() {
  posterRevision++
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
  posterUrl.value = ''
}
watch([theme, language], clearPoster)
async function makePoster() {
  if (posterBusy.value) return
  posterBusy.value = true
  const revision = posterRevision
  try {
    const blob = await createPoster({ name: config.name, greeting: text(config.greeting), avatar: config.avatar ? asset(config.avatar) : '', url: shareUrl, dark: theme.value === 'dark', language: language.value })
    if (revision !== posterRevision) return
    if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
    posterUrl.value = URL.createObjectURL(blob)
  } catch { notice(t.value.posterError) }
  finally { posterBusy.value = false }
}
</script>

<template>
  <div class="page-shell" id="top">
    <div class="atmosphere" aria-hidden="true"></div>
    <div class="layout">
      <header class="topbar topbar-drop" ref="topbar">
        <a class="brand" href="#top" :aria-label="t.home"><span class="brand-mark">h<span>.</span></span><span>{{ config.name }}<span class="brand-sub">PERSONAL SPACE</span></span></a>
        <div class="toolbar">
          <button class="language-button" @click="language = language === 'zh' ? 'en' : 'zh'" :aria-label="t.language"><span :class="{ active: language === 'zh' }">中</span><span class="slash">/</span><span :class="{ active: language === 'en' }">EN</span></button>
          <span class="toolbar-divider"></span>
          <button class="icon-button theme-button" @click="toggleTheme" :aria-label="t.theme + (theme === 'dark' ? t.light : t.dark)"><Transition name="spin" mode="out-in"><Icon :key="theme" :name="theme === 'dark' ? 'sun' : 'moon'" /></Transition></button>
          <button class="nav-share" @click="share"><span>{{ t.share }}</span><Icon name="share" /></button>
        </div>
      </header>
      <main>
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-copy" ref="heroCopy" :class="{ 'is-revealing': entering }">
            <div class="availability copy-fade" style="--fade-delay:920ms"><span class="status-dot"></span>{{ text(config.availability) }}</div>
            <p class="hello copy-wipe" style="--wipe-delay:200ms">{{ t.hello }}<span class="hello-line"></span></p>
            <h1 id="hero-title" class="copy-wipe" style="--wipe-delay:280ms">{{ config.name }}<span class="title-period">.</span></h1>
            <h2 class="copy-wipe" style="--wipe-delay:380ms">{{ text(config.greeting) }}</h2>
            <p v-if="text(config.bio)" class="bio copy-fade" style="--fade-delay:980ms">{{ text(config.bio) }}</p>
            <a class="primary-button copy-fade" style="--fade-delay:1060ms" href="#connections">{{ t.contact }}<Icon name="arrow" /></a>
            <div class="hero-meta copy-fade" style="--fade-delay:1140ms"><template v-if="text(config.location)"><Icon name="globe" /><span>{{ text(config.location) }}</span><span class="meta-dot">·</span></template><span>{{ config.handle }}</span></div>
          </div>
          <div class="identity-stage" :class="{ 'is-entering': entering, 'is-entry-ready': entranceReady, 'is-turning-stage': turning }" :style="{ '--orbit-start-1': orbitStartOne, '--orbit-start-2': orbitStartTwo }">
            <div class="orbital orbital-one" aria-hidden="true"></div><div class="orbital orbital-two" aria-hidden="true"></div><div class="motion-aura" aria-hidden="true"></div><div class="motion-sparks" aria-hidden="true"><i v-for="n in 6" :key="n"></i></div>
            <div class="ground-shadow stage-ambient" aria-hidden="true"></div><div class="orbit-front" aria-hidden="true"></div><span class="stage-coordinate coordinate-top stage-ambient" aria-hidden="true">PERSONAL IDENTITY — 001</span>
            <div class="float-anchor" @click="activateStack" @pointerenter="enterStack" @pointermove="moveStack" @pointerleave="leaveStack"><div class="card-entry-travel" ref="entryTravel" :class="{ 'is-entering': entering }"><div class="float-rig" :class="{ 'is-sharing': stackOpen, 'is-pressed': stackPressed, 'is-entering': entering }"><div class="card-pressure" ref="pressure"><div class="identity-stack" ref="stack" :style="{ '--turn-x': `${turnX}deg`, '--turn-y': `${turnY}deg` }" :class="{ 'is-open': stackOpen, 'has-interacted': stackUsed, 'has-copied': copiedValue === shareUrl, 'is-pressed': stackPressed, 'is-turning': turning, 'is-entering': entering }" role="button" tabindex="0" :aria-label="t.revealShare" :aria-expanded="stackOpen" @pointerdown="lastPointerType = $event.pointerType" @focus="focusStack" @blur="leaveStack()" @keydown.enter.prevent="activateStack($event)" @keydown.space.prevent="activateStack($event)" @keydown.up.prevent="activateStack($event)" @keydown.down.prevent="activateStack($event)" @keydown.left.prevent="activateStack($event)" @keydown.right.prevent="activateStack($event)">
            <div v-for="z in coreLayers" :key="z" class="card-core-layer" :style="{ '--core-z': `${z}px` }" aria-hidden="true"></div>
            <div class="identity-card identity-front" ref="identity" :aria-hidden="stackOpen"><i v-for="n in 4" :key="n" class="surface-probe" :class="`probe-${n}`" aria-hidden="true"></i>
              <div class="card-sheen" aria-hidden="true"></div><div class="motion-glint" aria-hidden="true"></div>
              <div class="identity-top"><span class="micro-label">{{ t.card }}</span><span class="identity-symbol" aria-hidden="true">✳</span></div>
              <div class="sculpture" aria-hidden="true"><span v-if="rippleKey" :key="rippleKey" class="avatar-ripple"></span><img v-if="config.avatar" class="sculpture-avatar" :src="asset(config.avatar)" alt="" /><template v-else><span class="sculpture-shadow">{{ config.monogram }}</span><span class="sculpture-letter">{{ config.monogram }}<i>.</i></span></template></div>
              <div class="identity-bottom"><div class="identity-owner"><img v-if="config.avatar" :src="asset(config.avatar)" alt="" /><span v-else class="mini-avatar">{{ config.monogram }}</span><div><strong>{{ config.name }}</strong><span>{{ t.available }}</span></div></div><span class="identity-qr" aria-hidden="true"><Icon name="qr" /></span></div>
              <div class="identity-edge"><span>DK CONNECT</span><span>01 — ∞</span></div>
            </div>
            <div class="identity-card identity-share" :aria-hidden="!stackOpen"><i v-for="n in 4" :key="n" class="surface-probe" :class="`probe-${n}`" aria-hidden="true"></i>
              <div class="card-sheen" aria-hidden="true"></div><div class="motion-glint" aria-hidden="true"></div>
              <div class="identity-top"><span class="micro-label">{{ t.share }}</span><Icon name="arrow" /></div>
              <div class="stack-qr"><img v-if="stackQr && !stackQrFailed" :src="stackQr" :alt="t.qr" draggable="false" @error="stackQrFailed = true" /><span v-else>{{ stackQrFailed ? t.qrFail : '···' }}</span></div>
              <div class="stack-share-caption"><strong>{{ config.name }}</strong><span>{{ t.scan }}</span></div>
              <div class="identity-edge"><span>DK CONNECT</span><span><Icon name="arrow" /> {{ t.revealShare }}</span></div>
            </div><span v-if="copiedValue === shareUrl" class="motion-copy-burst" aria-hidden="true">✳</span>
            </div>
            </div></div></div></div><span class="stage-coordinate coordinate-bottom stage-ambient" aria-hidden="true"><span class="tiny-cross">+</span> LESS DISTANCE. MORE CONNECTION.</span>
          </div>
        </section>
        <section class="connections reveal" id="connections" aria-labelledby="connections-title" style="--delay:1320ms">
          <div class="section-header"><div><p class="eyebrow"><span>01</span> / {{ t.section }}</p><h2 id="connections-title">{{ t.connect }}</h2></div><p class="section-hint">{{ t.hint }}</p></div>
          <div class="social-grid">
            <article v-for="(card, index) in config.cards" :key="card.id" class="social-card" :style="{ '--stagger': `${index % 5 * 65}ms` }" @pointermove="spotlight" @pointerdown="spotlight">
              <div class="social-top"><span class="social-icon"><Icon :name="card.icon" /></span><span class="card-number">{{ String(index + 1).padStart(2, '0') }}</span></div>
              <div class="social-body"><h3>{{ text(card.name) }}</h3><p>{{ text(card.subtitle) }}</p></div>
              <div class="social-bottom"><span class="social-status">{{ card.account || t.pending }}</span><button v-if="card.url && card.qrImage" class="card-link card-qr-link" @click="openCard(card)" :aria-label="`${t.viewQr} ${text(card.name)}`"><Icon name="qr" /></button><a v-if="card.url" class="card-link" :href="card.url" :target="card.url.startsWith('http') ? '_blank' : undefined" rel="noopener noreferrer" :aria-label="`${t.visit} ${text(card.name)}`"><Icon name="arrow" /></a><button v-else class="card-link" @click="openCard(card)" :aria-label="`${t.details} ${text(card.name)}`"><Icon name="arrow" /></button></div>
              <button v-if="card.account && card.copy" class="card-copy" @click="copy(card.account)" :aria-label="`${t.copy} ${text(card.name)}`"><Icon :name="copiedValue === card.account ? 'check' : 'copy'" /></button>
            </article>
          </div>
        </section>
        <section class="share-strip reveal" style="--delay:420ms"><div class="share-decoration" aria-hidden="true">✳</div><div class="share-copy"><h2>{{ t.shareTitle }}</h2><p>{{ t.shareBody }}</p></div><button class="secondary-button" @click="showShare"><Icon name="qr" /><span>{{ t.share }}</span><Icon name="arrow" /></button></section>
      </main>
      <footer><a href="#top" :aria-label="t.back" class="footer-wordmark">h<span>.</span></a><span>© {{ year }} {{ config.name }}<span class="footer-divider">/</span>{{ t.footer }}</span><span class="footer-credit">BUILT WITH DK CONNECT <span>↗</span></span></footer>
    </div>
    <Transition name="modal"><div v-if="modalOpen" class="modal-backdrop" @click.self="close"><section ref="modal" class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button class="icon-button close-button" @click="close" :aria-label="t.close"><Icon name="close" /></button><p class="eyebrow">{{ config.handle }}</p><h2 id="dialog-title">{{ shareOpen ? t.share : selected ? text(selected.name) : '' }}</h2><p class="modal-description">{{ shareOpen ? t.scan : selected?.account ? t.manual : t.unsetBody }}</p><div v-if="qrData && !qrFailed" class="qr-frame" :class="{ 'qr-frame-original': selected?.id === 'telegram' }"><img :src="qrData" :alt="shareOpen ? t.qr : selected ? text(selected.name) : ''" @error="qrFailed = true" /></div><div v-else-if="!shareOpen && !selected?.account" class="empty-contact"><Icon :name="selected?.icon || 'globe'" /><span>{{ t.unset }}</span></div><p v-if="qrFailed && shareOpen" class="modal-description">{{ t.qrFail }}</p><p v-if="shareOpen || selected?.account" class="account-line">{{ shareOpen ? shareUrl : selected?.account }}</p><button v-if="shareOpen || selected?.account" class="primary-button modal-copy" @click="copy(shareOpen ? shareUrl : selected!.account)"><Icon :name="copiedValue === (shareOpen ? shareUrl : selected?.account) ? 'check' : 'copy'" />{{ copiedValue === (shareOpen ? shareUrl : selected?.account) ? t.copied : shareOpen ? t.copyLink : t.copy }}</button><template v-if="shareOpen"><p v-if="localPreview" class="local-preview-note">{{ t.localPreview }}</p><button class="secondary-button poster-button" @click="makePoster" :disabled="posterBusy"><Icon name="download" />{{ posterBusy ? t.creating : t.poster }}</button><div v-if="posterUrl" class="poster-preview"><img :src="posterUrl" :alt="`${config.name} — ${t.poster}`" /><a class="primary-button" :href="posterUrl" :download="`${config.name}-card.png`"><Icon name="download" />{{ t.download }}</a></div></template></section></div></Transition>
    <Teleport to="body"><Transition name="cursor-hint"><div v-if="cursorHint" class="cursor-copy-hint" :style="{ left: cursor.x + 'px', top: cursor.y + 'px' }" aria-hidden="true"><Icon name="arrow" />{{ flipHint }}</div></Transition></Teleport>
    <Transition name="toast"><div v-if="toast" class="toast-message" role="status"><span>✓</span>{{ toast }}</div></Transition>
  </div>
</template>
