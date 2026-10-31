import { onMounted, onBeforeUnmount, ref } from 'vue'

/** Track existing document sections without changing their layout or scrolling. */
export function useScrollHeader() {
  const scrolled = ref(false)
  const section = ref(0)
  const progress = ref(0)
  let frame = 0
  const update = () => {
    frame = 0
    scrolled.value = window.scrollY > 24
    const elements = ['.hero', '#connections']
      .map(selector => document.querySelector<HTMLElement>(selector))
    const line = window.innerHeight * .32
    let active = 0
    elements.forEach((element, index) => {
      if (element && element.getBoundingClientRect().top <= line) active = index
    })
    const bottom = window.scrollY > 24 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3
    if (bottom) active = elements.length - 1
    section.value = active
    const top = elements[active]?.getBoundingClientRect().top ?? 0
    const next = elements[active + 1]?.getBoundingClientRect().top
    progress.value = bottom ? 1 : Math.max(0, Math.min(1, (line - top) / Math.max(1, next === undefined ? (elements[active]?.offsetHeight ?? 1) : next - top)))
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  onMounted(() => {
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  })
  return { scrolled, section, progress }
}
