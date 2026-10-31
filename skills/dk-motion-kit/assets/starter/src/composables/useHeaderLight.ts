import { ref, watch, nextTick, type Ref } from "vue";
export function useHeaderLight(
  scrolled: Ref<boolean>,
  reducedMotion: () => boolean,
) {
  let sweepPlayed = false;
  const sweepHandoff = ref(false);
  let handoffAnimation: Animation | undefined;
  let handoffFrame = 0;
  let handoffRevision = 0;
  function cancelSweep() {
    handoffRevision++;
    cancelAnimationFrame(handoffFrame);
    handoffAnimation?.cancel();
    handoffAnimation = undefined;
    sweepHandoff.value = false;
    startupSweep.value = false;
  }
  async function interruptSweep() {
    if (!startupSweep.value) return;
    const beam = document.querySelector<HTMLElement>(".startup-glow");
    if (!beam || reducedMotion()) {
      cancelSweep();
      return;
    }
    const from = beam.getBoundingClientRect();
    const fromOpacity = getComputedStyle(beam).opacity;
    const revision = ++handoffRevision;
    startupSweep.value = false;
    sweepHandoff.value = true;
    await nextTick();
    handoffFrame = requestAnimationFrame(() => {
      if (revision !== handoffRevision) return;
      const glow = document.querySelector<HTMLElement>(".header-glow");
      const track = glow?.parentElement;
      if (!glow || !track) {
        sweepHandoff.value = false;
        return;
      }
      const trackRect = track.getBoundingClientRect();
      const width = glow.offsetWidth;
      const range = document.documentElement.scrollHeight - innerHeight;
      const progress =
        range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0;
      handoffAnimation = glow.animate(
        [
          {
            left: `${from.left - trackRect.left}px`,
            width: `${from.width}px`,
            transform: "none",
            opacity: fromOpacity,
          },
          {
            left: `${progress * (trackRect.width - width)}px`,
            width: `${width}px`,
            transform: "none",
            opacity: 1,
          },
        ],
        {
          duration: 130,
          easing: "cubic-bezier(.12,.8,.2,1)",
          fill: "forwards",
        },
      );
      handoffAnimation.id = "scroll-light-handoff";
      const animation = handoffAnimation;
      void animation.finished
        .catch(() => {})
        .then(async () => {
          if (revision === handoffRevision) {
            sweepHandoff.value = false;
            await nextTick();
            animation.cancel();
            if (handoffAnimation === animation) handoffAnimation = undefined;
          }
        });
    });
  }
  function wheelDuringSweep(event: WheelEvent) {
    if (
      event.deltaY > 0 &&
      !event.ctrlKey &&
      !document.querySelector('[role="dialog"]')
    ) {
      hasScrolled.value = true;
      void interruptSweep();
    }
  }
  function startSweepWithAura(event: AnimationEvent) {
    if (
      event.animationName !== "aura-bloom" ||
      sweepPlayed ||
      hasScrolled.value ||
      reducedMotion()
    )
      return;
    sweepPlayed = true;
    startupSweep.value = true;
  }
  const startupSweep = ref(false);
  const hasScrolled = ref(false);
  watch(scrolled, (value) => {
    if (value) {
      hasScrolled.value = true;
      void interruptSweep();
    }
  });
  function finishSweep(event: AnimationEvent) {
    if (event.animationName === "startup-sweep") startupSweep.value = false;
  }

  return {
    startupSweep,
    hasScrolled,
    sweepHandoff,
    cancelSweep,
    wheelDuringSweep,
    startSweepWithAura,
    finishSweep,
  };
}
