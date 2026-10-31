import { onMounted, onBeforeUnmount, ref } from 'vue'

/** Track document scroll progress without changing their layout or scrolling. */
export function useScrollHeader() {
  const scrolled = ref(false)
  const progress = ref(0)
  let frame = 0
  const update = () => {
    frame = 0
    scrolled.value = window.scrollY > 24
    const range = document.documentElement.scrollHeight - window.innerHeight
    progress.value = range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0
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
  return { scrolled, progress }
}
