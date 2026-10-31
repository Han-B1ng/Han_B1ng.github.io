import { onMounted, onBeforeUnmount, type Ref } from 'vue';

/** Pause decorative loops offscreen or in background tabs; leave entrance one-shots alone. */
export function useMotionBudget(root: Ref<HTMLElement | undefined>) {
  let observer: IntersectionObserver | undefined;
  let inView = true;
  const update = () => root.value?.classList.toggle('is-motion-idle', document.hidden || !inView);
  onMounted(() => {
    update();
    document.addEventListener('visibilitychange', update);
    const hero = root.value?.querySelector('.hero');
    if (hero && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        inView = entries[0]?.isIntersecting ?? true;
        update();
      }, { rootMargin: '80px' });
      observer.observe(hero);
    }
  });
  onBeforeUnmount(() => { observer?.disconnect(); document.removeEventListener('visibilitychange', update); });
}
