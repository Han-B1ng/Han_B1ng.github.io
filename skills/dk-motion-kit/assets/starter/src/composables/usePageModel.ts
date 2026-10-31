import { useIdentityCard } from "./useIdentityCard";
import { useShare } from "./useShare";
import { useHeaderLight } from "./useHeaderLight";
import { useEntranceTimeline } from "./useEntranceTimeline";
import { useLanguageTransition } from "./useLanguageTransition";

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { words } from "../i18n";
import { useScrollHeader } from "../composables/useScrollHeader";
import { usePreferences } from "../composables/usePreferences";
import { config, type Localized } from "../config";
function createPageModel() {
  const { language, theme } = usePreferences();
  const {
    scrolled,
    inConnections,
    progress: scrollProgress,
  } = useScrollHeader();
  const sectionHeader = ref<HTMLElement>();
  const sectionBar = ref<HTMLElement>();
  const headerIdentity = computed(() =>
    !scrolled.value
      ? "PERSONAL SPACE"
      : inConnections.value
        ? words[language.value].headerConnections
        : words[language.value].headerHome,
  );
  const {
    startupSweep,
    hasScrolled,
    sweepHandoff,
    cancelSweep,
    wheelDuringSweep,
    startSweepWithAura,
    finishSweep,
  } = useHeaderLight(scrolled, () => reducedMotion());
  const { toggleLanguage, disposeLanguage } = useLanguageTransition(
    language,
    () => reducedMotion(),
  );
  const text = (value: Localized) =>
    typeof value === "string" ? value : value[language.value];
  const t = computed(() => words[language.value]);
  const {
    selected,
    shareOpen,
    modalOpen,
    qrData,
    qrFailed,
    toast,
    shareUrl,
    localPreview,
    modal,
    copiedValue,
    posterUrl,
    posterBusy,
    copy,
    openCard,
    showShare,
    share,
    close,
    makePoster,
  } = useShare({ t, theme, language, text, asset: (path) => asset(path) });
  const {
    identity,
    stack,
    pressure,
    entryTravel,
    heroCopy,
    topbar,
    revealPassedText,
    stackOpen,
    stackUsed,
    stackPressed,
    turnX,
    turnY,
    turning,
    coreLayers,
    entering,
    entranceReady,
    orbitStartOne,
    orbitStartTwo,
    flipHint,
    finishEntrance,
    resetCard,
    stackQr,
    stackQrFailed,
    cursorHint,
    cursor,
    lastPointerType,
    prepareStackQr,
    moveStack,
    enterStack,
    leaveStack,
    activateStack,
    focusStack,
    outsideStack,
    rippleKey,
    stopCardMotion,
  } = useIdentityCard({
    language,
    shareUrl,
    reducedMotion: () => reducedMotion(),
  });
  let previousFocus: HTMLElement | null = null;
  const asset = (path: string) =>
    path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
  const { startEntrance, stopEntrance } = useEntranceTimeline({
    stack,
    entryTravel,
    entering,
    entranceReady,
    topbar,
    sectionHeader,
    sectionBar,
    reducedMotion: () => reducedMotion(),
    revealPassedText,
    finishEntrance,
  });
  onMounted(() => {
    window.addEventListener("wheel", wheelDuringSweep, { passive: true });
    motionQuery.addEventListener("change", motionChanged);
    window.addEventListener("keydown", keydown);
    window.addEventListener("pointerdown", outsideStack);
    void prepareStackQr();
    if (reducedMotion()) {
      entering.value = false;
    } else {
      if (document.readyState === "complete") startEntrance();
      else window.addEventListener("load", startEntrance, { once: true });
    }
    if ("IntersectionObserver" in window && !reducedMotion()) {
      scrollObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              scrollObserver?.unobserve(entry.target);
            }
        },
        { threshold: 0.12 },
      );
      document.querySelectorAll(".share-strip").forEach((el) => {
        el.classList.add("scroll-enter");
        scrollObserver?.observe(el);
      });
    }
  });
  function disposeEffects() {
    window.removeEventListener("wheel", wheelDuringSweep);
    cancelSweep();
    disposeLanguage();
    motionQuery.removeEventListener("change", motionChanged);
    window.removeEventListener("load", startEntrance);
    window.removeEventListener("pointerdown", outsideStack);
    window.removeEventListener("keydown", keydown);
    stopEntrance();
    scrollObserver?.disconnect();
    document.body.style.overflow = "";
  }
  onBeforeUnmount(disposeEffects);
  watch(modalOpen, async (open) => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      previousFocus = document.activeElement as HTMLElement;
      await nextTick();
      modal.value?.querySelector<HTMLButtonElement>("button")?.focus();
    } else previousFocus?.focus();
  });
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape" && (turnX.value || turnY.value)) resetCard();
    if (!modalOpen.value) return;
    if (event.key === "Escape") close();
    if (event.key !== "Tab") return;
    const items = modal.value?.querySelectorAll<HTMLElement>(
      "button:not(:disabled), a[href]",
    );
    if (!items?.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  const year = new Date().getFullYear();

  let scrollObserver: IntersectionObserver | undefined;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = () => motionQuery.matches;
  function motionChanged() {
    if (!reducedMotion()) return;
    cancelSweep();
    stopEntrance();
    if (entering.value) {
      if (topbar.value) {
        topbar.value.style.transform = "none";
        topbar.value.style.opacity = "1";
      }
      finishEntrance();
    }
    stopCardMotion();
  }
  let themeBusy = false;
  async function toggleTheme(event: MouseEvent) {
    if (themeBusy) return;
    const apply = async () => {
      theme.value = theme.value === "dark" ? "light" : "dark";
      await nextTick();
    };
    const doc = document as Document & {
      startViewTransition?: (callback: () => Promise<void>) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };
    if (!doc.startViewTransition || reducedMotion()) {
      await apply();
      return;
    }
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = bounds.left + bounds.width / 2,
      y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );
    themeBusy = true;
    document.documentElement.classList.add("theme-transitioning");
    const transition = doc.startViewTransition(apply);
    try {
      await transition.ready;
      const animation = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 650,
          easing: "cubic-bezier(.22,1,.36,1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
      await animation.finished;
    } catch {
      /* Unsupported pseudo-element animation still leaves the new theme applied. */
    } finally {
      await transition.finished.catch(() => {});
      document.documentElement.classList.remove("theme-transitioning");
      themeBusy = false;
    }
  }
  return {
    sectionHeader,
    sectionBar,
    hasScrolled,
    text,
    t,
    toast,
    entering,
    flipHint,
    cursorHint,
    cursor,
    copy,
    openCard,
    showShare,
    copiedValue,
    config,
    heroCopy,
    startSweepWithAura,
    shareUrl,
    identity,
    stack,
    pressure,
    entryTravel,
    stackOpen,
    stackUsed,
    stackPressed,
    turnX,
    turnY,
    turning,
    coreLayers,
    entranceReady,
    orbitStartOne,
    orbitStartTwo,
    stackQr,
    stackQrFailed,
    lastPointerType,
    moveStack,
    enterStack,
    leaveStack,
    activateStack,
    focusStack,
    asset,
    rippleKey,
    selected,
    shareOpen,
    modalOpen,
    qrData,
    qrFailed,
    localPreview,
    modal,
    close,
    posterUrl,
    posterBusy,
    makePoster,
    year,
    language,
    theme,
    scrolled,
    scrollProgress,
    headerIdentity,
    sweepHandoff,
    startupSweep,
    finishSweep,
    toggleLanguage,
    topbar,
    share,
    toggleTheme,
  };
}
export function usePageModel() {
  return createPageModel();
}
