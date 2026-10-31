import { onMounted, onBeforeUnmount, ref } from "vue";

/** Track document scroll progress without changing their layout or scrolling. */
export function useScrollHeader() {
  const scrolled = ref(false);
  const progress = ref(0);
  const inConnections = ref(false);
  let frame = 0;
  const update = () => {
    frame = 0;
    scrolled.value = window.scrollY > 24;
    const bar = document.querySelector(".section-bar");
    const header = document.querySelector("header");
    // Use the stable end of the shrinking header, so its own transition cannot
    // cause repeated label changes near the boundary.
    const headerBottom = Math.min(
      header?.getBoundingClientRect().bottom ?? 76,
      window.innerWidth <= 760 ? 68 : 76,
    );
    inConnections.value =
      scrolled.value &&
      !!bar &&
      bar.getBoundingClientRect().top <= headerBottom;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    progress.value =
      range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  onMounted(() => {
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  });
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  });
  return { scrolled, inConnections, progress };
}
