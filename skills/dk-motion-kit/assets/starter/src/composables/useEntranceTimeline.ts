import type { Ref } from "vue";
export function useEntranceTimeline(context: {
  stack: Ref<HTMLElement | undefined>;
  entryTravel: Ref<HTMLElement | undefined>;
  entering: Ref<boolean>;
  entranceReady: Ref<boolean>;
  topbar: Ref<HTMLElement | undefined>;
  sectionHeader: Ref<HTMLElement | undefined>;
  sectionBar: Ref<HTMLElement | undefined>;
  reducedMotion: () => boolean;
  revealPassedText: (progress: number) => void;
  finishEntrance: () => void;
}) {
  const {
    stack,
    entryTravel,
    entering,
    entranceReady,
    topbar,
    sectionHeader,
    sectionBar,
    reducedMotion,
    revealPassedText,
    finishEntrance,
  } = context;
  let entranceStartFrame = 0;
  function startEntrance() {
    cancelAnimationFrame(entranceStartFrame);
    let started: number | undefined;
    const frame = (now: number) => {
      const anchor = stack.value?.closest(
        ".float-anchor",
      ) as HTMLElement | null;
      const travel = entryTravel.value;
      if (!anchor || !travel || !stack.value || !entering.value) return;
      started ??= now;
      const progress = Math.min(1, (now - started) / 1400);
      // Read the stationary anchor, never the already-transformed card. Recompute on
      // every frame so window resizing, zoom and layout changes use current bounds.
      const rect = anchor.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const start = viewportLeft - rect.right - rect.width * 0.5;
      // One continuous flight curve: the screen center is a pass-through point.
      const flight = Math.min(1, progress / 0.55);
      const distance = flight * flight;
      const x = start * (1 - distance);
      // Start turning as the leading edge enters the viewport, rather than at its center.
      const appearanceOffset = viewportLeft - rect.right + rect.width * 0.08;
      const appearanceDistance = Math.max(
        0,
        Math.min(1, 1 - appearanceOffset / start),
      );
      const flipStart = 0.55 * Math.sqrt(appearanceDistance);
      const angle =
        progress < flipStart
          ? 0
          : progress < 0.55
            ? 180 * ((progress - flipStart) / (0.55 - flipStart))
            : progress < 0.75
              ? 180
              : 180 + 180 * Math.pow(Math.min(1, (progress - 0.75) / 0.25), 2);
      travel.style.setProperty("--entry-offset", `${x}px`);
      travel.style.setProperty("--entry-rise", "0px");
      travel.style.setProperty("--entry-roll", "0deg");
      stack.value.style.setProperty("--entry-angle", `${angle}deg`);
      revealPassedText(progress);
      const headerT = Math.max(0, Math.min(1, (progress - 0.72) / 0.28));
      const headerEase = headerT * headerT * headerT;
      const sectionT = Math.max(0, Math.min(1, (progress - 0.72) / 0.28));
      const hintT = Math.max(0, Math.min(1, (progress - 0.78) / 0.22));
      sectionBar.value?.style.setProperty(
        "--section-reveal",
        `${sectionT * sectionT * (3 - 2 * sectionT)}`,
      );
      sectionHeader.value?.style.setProperty(
        "--section-reveal",
        `${sectionT * sectionT * (3 - 2 * sectionT)}`,
      );
      sectionHeader.value?.style.setProperty(
        "--hint-reveal",
        `${hintT * hintT * (3 - 2 * hintT)}`,
      );

      if (topbar.value) {
        topbar.value.style.transform = `translateY(${-38 * (1 - headerEase)}px)`;
        topbar.value.style.opacity = `${Math.min(1, headerT * 2)}`;
      }
      entranceReady.value = true;
      if (progress < 1 && !reducedMotion())
        entranceStartFrame = requestAnimationFrame(frame);
      else finishEntrance();
    };
    entranceStartFrame = requestAnimationFrame(frame);
  }

  const stopEntrance = () => cancelAnimationFrame(entranceStartFrame);
  return { startEntrance, stopEntrance };
}
