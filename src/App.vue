<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import QRCode from "qrcode";
import Icon from "./Icon.vue";
import { words } from "./i18n";
import AvatarImage from "./components/AvatarImage.vue";
import SocialGrid from "./components/SocialGrid.vue";
import SharePanel from "./components/SharePanel.vue";
import { useScrollHeader } from "./composables/useScrollHeader";
import { usePreferences } from "./composables/usePreferences";
import { getCardZone, surfacePoint, type CardZone } from "./cardGeometry";
import { createPoster } from "./poster";
import { config, type Localized, type SocialCard } from "./config";
const { language, theme } = usePreferences();
const { scrolled, inConnections, progress: scrollProgress } = useScrollHeader();
const sectionHeader = ref<HTMLElement>();
const sectionBar = ref<HTMLElement>();
const headerIdentity = computed(() => !scrolled.value ? 'PERSONAL SPACE' : inConnections.value
  ? (language.value === 'zh' ? '01 / 我的数字坐标' : '01 / My digital coordinates')
  : (language.value === 'zh' ? '00 / 首页' : '00 / Home'));
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
  const beam = document.querySelector<HTMLElement>('.startup-glow');
  if (!beam || reducedMotion()) { cancelSweep(); return; }
  const from = beam.getBoundingClientRect();
  const fromOpacity = getComputedStyle(beam).opacity;
  const revision = ++handoffRevision;
  startupSweep.value = false;
  sweepHandoff.value = true;
  await nextTick();
  handoffFrame = requestAnimationFrame(() => {
    if (revision !== handoffRevision) return;
    const glow = document.querySelector<HTMLElement>('.header-glow');
    const track = glow?.parentElement;
    if (!glow || !track) { sweepHandoff.value = false; return; }
    const trackRect = track.getBoundingClientRect();
    const width = glow.offsetWidth;
    const range = document.documentElement.scrollHeight - innerHeight;
    const progress = range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0;
    handoffAnimation = glow.animate([
      { left: `${from.left-trackRect.left}px`, width: `${from.width}px`, transform:'none', opacity:fromOpacity },
      { left: `${progress*(trackRect.width-width)}px`, width: `${width}px`, transform:'none', opacity:1 },
    ], { duration:130, easing:'cubic-bezier(.12,.8,.2,1)' });
    handoffAnimation.id = 'scroll-light-handoff';
    void handoffAnimation.finished.catch(() => {}).then(() => {
      if (revision === handoffRevision) { sweepHandoff.value = false; handoffAnimation = undefined; }
    });
  });
}
function wheelDuringSweep(event: WheelEvent) {
  if (event.deltaY > 0 && !event.ctrlKey && !document.querySelector('[role="dialog"]')) {
    hasScrolled.value = true;
    void interruptSweep();
  }
}
function startSweepWithAura(event: AnimationEvent) {
  if (event.animationName !== 'aura-bloom' || sweepPlayed || hasScrolled.value || reducedMotion()) return;
  sweepPlayed = true;
  startupSweep.value = true;
}
const startupSweep = ref(false);
const hasScrolled = ref(false);
watch(scrolled, value => {
  if (value) { hasScrolled.value = true; void interruptSweep(); }
});
function finishSweep(event: AnimationEvent) {
  if (event.animationName === 'startup-sweep') startupSweep.value = false;
}

let languageBusy = false;
let languageDisposed = false;
let languageAnimations: Animation[] = [];
async function toggleLanguage() {
  if (languageBusy) return;
  if (reducedMotion()) { language.value = language.value === 'zh' ? 'en' : 'zh'; return; }
  languageBusy = true;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.hero-copy > *, .social-body, .social-status, .share-copy, .nav-share > span, .section-header > div, .section-hint, .stack-share-caption > span, .identity-top .micro-label, .identity-owner div > span, footer > span'));
  try {
    languageAnimations = nodes.map(node => node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: 'forwards' }));
    await Promise.all(languageAnimations.map(animation => animation.finished));
    if (languageDisposed) return;
    language.value = language.value === 'zh' ? 'en' : 'zh';
    await nextTick();
    languageAnimations.forEach(animation => animation.cancel());
    languageAnimations = nodes.map(node => node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }));
    await Promise.all(languageAnimations.map(animation => animation.finished));
  } catch { /* Cancelled animations leave the current text visible. */ }
  finally { languageAnimations.forEach(animation => animation.cancel()); languageAnimations = []; languageBusy = false; }
}

const text = (value: Localized) =>
  typeof value === "string" ? value : value[language.value];
const t = computed(() => words[language.value]);
const selected = ref<SocialCard | null>(null);
const shareOpen = ref(false);
const modalOpen = computed(() => Boolean(selected.value || shareOpen.value));
const qrData = ref("");
const qrFailed = ref(false);
const toast = ref("");
const shareUrl = config.publicUrl || window.location.href.split("#")[0];
const localPreview = ["localhost", "127.0.0.1", "[::1]"].includes(
  new URL(shareUrl).hostname,
);
const modal = ref<HTMLElement>();
const identity = ref<HTMLElement>();
const stack = ref<HTMLElement>();
const pressure = ref<HTMLElement>();
const entryTravel = ref<HTMLElement>();
const heroCopy = ref<HTMLElement>();
const topbar = ref<HTMLElement>();
let textRevealStart: number | undefined;
function revealPassedText(progress: number) {
  const copy = heroCopy.value;
  const plane = pressure.value;
  if (!copy || !plane) return;
  const textRect = copy.getBoundingClientRect();
  const cardRect = plane.getBoundingClientRect();
  const desktop = window.innerWidth > 760;
  const visible = Math.max(
    0,
    Math.min(textRect.width, cardRect.left - textRect.left - 50),
  );
  copy.style.setProperty("--copy-revealed", `${visible}px`);
  if (
    textRevealStart === undefined &&
    (desktop ? visible > 0 : progress >= 0.2)
  )
    textRevealStart = progress;
  const start = textRevealStart ?? 1;
  for (const [selector, delay] of [
    [".copy-wipe", 0],
    [".copy-fade", 0.24],
  ] as const) {
    copy.querySelectorAll<HTMLElement>(selector).forEach((line, index) => {
      const t = Math.max(
        0,
        Math.min(1, (progress - start - delay - index * 0.035) / 0.17),
      );
      line.style.setProperty("--passed-alpha", `${t * t * (3 - 2 * t)}`);
    });
  }
}
const stackOpen = ref(false);
const stackUsed = ref(false);
const stackPressed = ref(false);
const turnX = ref(0);
const turnY = ref(0);
const turning = ref(false);
const hoverZone = ref<CardZone>("right");
const coreLayers = [-2.4, -1.2, 0, 1.2, 2.4];
const entering = ref(true);
const entranceReady = ref(false);
let entranceStartFrame = 0;
const orbitStartOne = ref(`${Math.floor(Math.random() * 360)}deg`);
const orbitStartTwo = ref(`${Math.floor(Math.random() * 360)}deg`);
let flipTimer: ReturnType<typeof setTimeout> | undefined;
const flipHint = computed(() => {
  const hints =
    language.value === "zh"
      ? {
          top: "点击翻转上沿",
          bottom: "点击翻转下沿",
          left: "点击向左翻",
          right: "点击向右翻",
          none: "移到上下或左右边缘翻转",
        }
      : {
          top: "Flip from the top",
          bottom: "Flip from the bottom",
          left: "Flip left",
          right: "Flip right",
          none: "Move to an edge to flip",
        };
  return hints[hoverZone.value];
});
function cardZone(clientX: number, clientY: number): CardZone {
  const rect = stack.value?.closest(".float-anchor")?.getBoundingClientRect();
  if (!rect) return "right";
  const x = (clientX - rect.left) / rect.width,
    y = (clientY - rect.top) / rect.height;
  return getCardZone(x, y);
}
function finishEntrance() {
  if (!entering.value) return;
  // Keep the completed revolution as the interaction baseline, avoiding a reverse unwind.
  turnX.value = 0;
  turnY.value = 360;
  stackOpen.value = false;
  entering.value = false;
  if (topbar.value) {
    topbar.value.style.transform = "none";
    topbar.value.style.opacity = "1";
  }
  if (mouseInside && pointerPosition) {
    stackPressed.value = true;
    hoverZone.value = cardZone(pointerPosition.x, pointerPosition.y);
    applyPointerTilt(pointerPosition.x, pointerPosition.y);
    if (!lightFrame) lightFrame = requestAnimationFrame(updateSurfaceLights);
  }
}
function resetCard() {
  clearTimeout(flipTimer);
  turning.value = false;
  turnX.value = 0;
  turnY.value = 0;
  stackOpen.value = false;
  leaveStack();
}
const stackQr = ref("");
const stackQrFailed = ref(false);
const cursorHint = ref(false);
const cursor = ref({ x: 0, y: 0 });
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
let mouseInside = false;
let lastPointerType = "mouse";
let lightFrame = 0;
let pointerPosition: { x: number; y: number } | null = null;
function updateSurfaceLights() {
  if (!mouseInside || !pointerPosition) {
    lightFrame = 0;
    return;
  }
  const faces = stack.value?.querySelectorAll<HTMLElement>(
    ".identity-front, .identity-share",
  );
  faces?.forEach((face) => {
    const points = Array.from(
      face.querySelectorAll<HTMLElement>(".surface-probe"),
    ).map((probe) => {
      const rect = probe.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    if (points.length !== 4) return;
    const point = surfacePoint(points, pointerPosition!.x, pointerPosition!.y);
    if (!point) return;
    face.style.setProperty(
      "--light-x",
      `${Math.max(0, Math.min(1, point.x)) * 100}%`,
    );
    face.style.setProperty(
      "--light-y",
      `${Math.max(0, Math.min(1, point.y)) * 100}%`,
    );
  });
  lightFrame = requestAnimationFrame(updateSurfaceLights);
}
async function prepareStackQr() {
  try {
    stackQr.value = await QRCode.toDataURL(shareUrl, {
      margin: 2,
      width: 360,
      color: { dark: "#111111", light: "#ffffff" },
    });
  } catch {
    stackQrFailed.value = true;
  }
}
function applyPointerTilt(clientX: number, clientY: number) {
  if (reducedMotion() || !identity.value) return;
  const bounds =
    stack.value?.closest(".float-anchor")?.getBoundingClientRect() ||
    identity.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
  stack.value?.style.setProperty("--light-x", `${x * 100}%`);
  stack.value?.style.setProperty("--light-y", `${y * 100}%`);
  pressure.value?.style.setProperty(
    "--rx",
    `${Math.max(-13, Math.min(13, (0.5 - y) * 24))}deg`,
  );
  pressure.value?.style.setProperty(
    "--ry",
    `${Math.max(-15, Math.min(15, (x - 0.5) * 28))}deg`,
  );
}
function moveStack(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  cursor.value = {
    x: Math.max(12, Math.min(event.clientX + 16, window.innerWidth - 236)),
    y: Math.min(event.clientY + 22, window.innerHeight - 52),
  };
  pointerPosition = { x: event.clientX, y: event.clientY };
  if (entering.value) return;
  if (!lightFrame) lightFrame = requestAnimationFrame(updateSurfaceLights);
  hoverZone.value = cardZone(event.clientX, event.clientY);
  applyPointerTilt(event.clientX, event.clientY);
}
function enterStack(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  mouseInside = true;
  pointerPosition = { x: event.clientX, y: event.clientY };
  if (entering.value) return;
  stackPressed.value = true;
  moveStack(event);
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    if (mouseInside) cursorHint.value = true;
  }, 1000);
}
function leaveStack(event?: PointerEvent) {
  if (event && event.pointerType !== "mouse") return;
  mouseInside = false;
  pointerPosition = null;
  cancelAnimationFrame(lightFrame);
  lightFrame = 0;
  stackPressed.value = false;
  clearTimeout(hoverTimer);
  cursorHint.value = false;
  resetTilt();
}
function activateStack(event: MouseEvent | KeyboardEvent) {
  if (turning.value || entering.value) return;
  let zone: CardZone;
  if (event instanceof KeyboardEvent) {
    const keys: Record<string, CardZone> = {
      ArrowUp: "top",
      ArrowDown: "bottom",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    zone = keys[event.key] || "right";
  } else zone = cardZone(event.clientX, event.clientY);
  if (zone === "none") return;
  rippleKey.value++;
  stackUsed.value = true;
  turning.value = true;
  // In rotateX(turnX) rotateY(turnY), rotateY rotates around the X-rotated local Y-axis.
  // When turnX is an odd multiple of 180deg, the local Y-axis points downward in screen space,
  // so we invert the Y delta to keep left/right flips aligned with screen direction.
  const xInverted = Math.abs(Math.round(turnX.value / 180)) % 2 === 1;
  const ySign = xInverted ? -1 : 1;
  if (zone === "top") turnX.value += 180;
  else if (zone === "bottom") turnX.value -= 180;
  else if (zone === "left") turnY.value -= 180 * ySign;
  else turnY.value += 180 * ySign;
  stackOpen.value = !stackOpen.value;
  hoverZone.value = zone;
  if (lastPointerType !== "mouse") {
    stackPressed.value = false;
  }
  flipTimer = setTimeout(
    () => {
      turning.value = false;
      if (mouseInside && pointerPosition) {
        stackPressed.value = true;
        applyPointerTilt(pointerPosition.x, pointerPosition.y);
        if (!lightFrame)
          lightFrame = requestAnimationFrame(updateSurfaceLights);
      } else if (!stack.value?.matches(":focus-visible")) {
        stackPressed.value = false;
        resetTilt();
      }
    },
    reducedMotion() ? 0 : 560,
  );
}
function focusStack() {
  if (stack.value?.matches(":focus-visible")) stackPressed.value = true;
}
function outsideStack(event: PointerEvent) {
  lastPointerType = event.pointerType;
  if (!stack.value?.closest(".float-anchor")?.contains(event.target as Node))
    leaveStack();
}
let previousFocus: HTMLElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const asset = (path: string) =>
  path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
function startEntrance() {
  cancelAnimationFrame(entranceStartFrame);
  let started: number | undefined;
  const frame = (now: number) => {
    const anchor = stack.value?.closest(".float-anchor") as HTMLElement | null;
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
    const sectionT = Math.max(0, Math.min(1, (progress - .72) / .28));
    const hintT = Math.max(0, Math.min(1, (progress - .78) / .22));
    sectionBar.value?.style.setProperty('--section-reveal', `${sectionT * sectionT * (3 - 2 * sectionT)}`);
    sectionHeader.value?.style.setProperty('--section-reveal', `${sectionT * sectionT * (3 - 2 * sectionT)}`);
    sectionHeader.value?.style.setProperty('--hint-reveal', `${hintT * hintT * (3 - 2 * hintT)}`);

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
onMounted(() => {
  window.addEventListener("wheel", wheelDuringSweep, { passive:true });
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
  languageDisposed = true;
  languageAnimations.forEach(animation => animation.cancel());
  motionQuery.removeEventListener("change", motionChanged);
  window.removeEventListener("load", startEntrance);
  window.removeEventListener("pointerdown", outsideStack);
  window.removeEventListener("keydown", keydown);
  cancelAnimationFrame(entranceStartFrame);
  cancelAnimationFrame(lightFrame);
  for (const timeout of [timer, flipTimer, hoverTimer, copyTimer])
    clearTimeout(timeout);
  scrollObserver?.disconnect();
  clearPoster();
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
function notice(value: string) {
  toast.value = value;
  clearTimeout(timer);
  timer = setTimeout(() => (toast.value = ""), 2600);
}
async function copy(value: string) {
  try {
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch {
        /* Try legacy fallback below. */
      }
    }
    if (!copied) {
      // Deprecated API intentionally retained for older/restricted browsers.
      const input = document.createElement("textarea");
      const focused = document.activeElement as HTMLElement | null;
      input.value = value;
      input.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(input);
      try {
        input.select();
        if (!document.execCommand("copy")) throw new Error("Copy denied");
      } finally {
        input.remove();
        focused?.focus({ preventScroll: true });
      }
    }
    copiedValue.value = value;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedValue.value = ""), 2200);
    notice(value === shareUrl ? t.value.linkCopied : t.value.copied);
  } catch {
    notice(t.value.failed);
  }
}
function openCard(card: SocialCard) {
  selected.value = card;
  shareOpen.value = false;
  qrFailed.value = false;
  qrData.value = card.qrImage ? asset(card.qrImage) : "";
}
async function showShare() {
  selected.value = null;
  shareOpen.value = true;
  qrData.value = "";
  qrFailed.value = false;
  try {
    const result = await QRCode.toDataURL(shareUrl, {
      margin: 2,
      width: 320,
      color: { dark: "#111111", light: "#ffffff" },
    });
    if (shareOpen.value) qrData.value = result;
  } catch {
    qrFailed.value = true;
  }
}
async function share() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${config.name} · Dk Connect`,
        url: shareUrl,
      });
      return;
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
  }
  await showShare();
}
function close() {
  selected.value = null;
  shareOpen.value = false;
  qrData.value = "";
}
function resetTilt() {
  pressure.value?.style.setProperty("--rx", "0deg");
  pressure.value?.style.setProperty("--ry", "0deg");
  stack.value?.style.setProperty("--light-x", "40%");
  stack.value?.style.setProperty("--light-y", "20%");
}
const year = new Date().getFullYear();
const copiedValue = ref("");
let copyTimer: ReturnType<typeof setTimeout> | undefined;
const rippleKey = ref(0);
const posterUrl = ref("");
const posterBusy = ref(false);
let posterRevision = 0;
let scrollObserver: IntersectionObserver | undefined;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const reducedMotion = () => motionQuery.matches;
function motionChanged() {
  if (!reducedMotion()) return;
  cancelSweep();
  cancelAnimationFrame(entranceStartFrame);
  if (entering.value) {
    if (topbar.value) {
      topbar.value.style.transform = "none";
      topbar.value.style.opacity = "1";
    }
    finishEntrance();
  }
  clearTimeout(flipTimer);
  turning.value = false;
  leaveStack();
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
function clearPoster() {
  posterRevision++;
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value);
  posterUrl.value = "";
}
watch([theme, language], clearPoster);
async function makePoster() {
  if (posterBusy.value) return;
  posterBusy.value = true;
  const revision = posterRevision;
  try {
    const blob = await createPoster({
      name: config.name,
      greeting: text(config.greeting),
      avatar: config.avatar ? asset(config.avatar) : "",
      url: shareUrl,
      dark: theme.value === "dark",
      language: language.value,
    });
    if (revision !== posterRevision) return;
    if (posterUrl.value) URL.revokeObjectURL(posterUrl.value);
    posterUrl.value = URL.createObjectURL(blob);
  } catch {
    notice(t.value.posterError);
  } finally {
    posterBusy.value = false;
  }
}
</script>

<template>
  <div class="page-shell" id="top">
    <div class="atmosphere" aria-hidden="true"></div>
    <div class="layout">
      <div class="topbar-space" aria-hidden="true"></div>
      <header class="topbar topbar-drop" :class="{ 'is-scrolled': scrolled }" ref="topbar">
        <a class="brand" href="#top" :aria-label="t.home"
          ><span class="brand-mark">h<span>.</span></span
          ><span
            >{{ config.name
            }}<span class="brand-sub"><Transition name="header-identity" mode="out-in"><span :key="headerIdentity">{{ headerIdentity }}</span></Transition></span></span
          ></a
        >
        <div class="toolbar">
          <button
            class="language-button"
            @click="toggleLanguage"
            :aria-label="t.language"
          >
            <span :class="{ active: language === 'zh' }">中</span
            ><span class="slash">/</span
            ><span :class="{ active: language === 'en' }">EN</span>
          </button>
          <span class="toolbar-divider"></span>
          <button
            class="icon-button theme-button"
            @click="toggleTheme"
            :aria-label="t.theme + (theme === 'dark' ? t.light : t.dark)"
          >
            <Transition name="spin" mode="out-in"
              ><Icon :key="theme" :name="theme === 'dark' ? 'sun' : 'moon'"
            /></Transition>
          </button>
          <button class="nav-share" @click="share">
            <span>{{ t.share }}</span
            ><Icon name="share" />
          </button>
        </div>
        <div class="header-track" :class="{ 'is-active': scrolled, 'is-starting': startupSweep, 'is-handoff': sweepHandoff }" :style="{ '--scroll-progress': scrollProgress }" aria-hidden="true"><span class="header-glow"></span><span v-if="startupSweep" class="startup-glow" @animationend="finishSweep"></span></div>
      </header>
      <main>
        <section class="hero" aria-labelledby="hero-title">
          <div
            class="hero-copy"
            ref="heroCopy"
            :class="{ 'is-revealing': entering }"
          >
            <div class="availability copy-fade" style="--fade-delay: 920ms">
              <span class="status-dot"></span>{{ text(config.availability) }}
            </div>
            <p class="hello copy-wipe" style="--wipe-delay: 200ms">
              {{ t.hello }}<span class="hello-line"></span>
            </p>
            <h1 id="hero-title" class="copy-wipe" style="--wipe-delay: 280ms">
              {{ config.name }}<span class="title-period">.</span>
            </h1>
            <h2 class="copy-wipe" style="--wipe-delay: 380ms">
              {{ text(config.greeting) }}
            </h2>
            <p
              v-if="text(config.bio)"
              class="bio copy-fade"
              style="--fade-delay: 980ms"
            >
              {{ text(config.bio) }}
            </p>
            <a
              class="primary-button copy-fade"
              style="--fade-delay: 1060ms"
              href="#connections"
              >{{ t.contact }}<Icon name="arrow"
            /></a>
            <div class="hero-meta copy-fade" style="--fade-delay: 1140ms">
              <template v-if="text(config.location)"
                ><Icon name="globe" /><span>{{ text(config.location) }}</span
                ><span class="meta-dot">·</span></template
              ><span>{{ config.handle }}</span>
            </div>
          </div>
          <div
            class="identity-stage"
            :class="{
              'is-entering': entering,
              'is-entry-ready': entranceReady,
              'is-turning-stage': turning,
            }"
            :style="{
              '--orbit-start-1': orbitStartOne,
              '--orbit-start-2': orbitStartTwo,
            }"
          >
            <div class="orbital orbital-one" aria-hidden="true"></div>
            <div class="orbital orbital-two" aria-hidden="true"></div>
            <div class="motion-aura" aria-hidden="true" @animationstart="startSweepWithAura"></div>
            <div class="ground-shadow stage-ambient" aria-hidden="true"></div>
            <div class="orbit-front" aria-hidden="true"></div>
            <span
              class="stage-coordinate coordinate-top stage-ambient"
              aria-hidden="true"
              >PERSONAL IDENTITY — 001</span
            >
            <div
              class="float-anchor"
              @click="activateStack"
              @pointerenter="enterStack"
              @pointermove="moveStack"
              @pointerleave="leaveStack"
            >
              <div
                class="card-entry-travel"
                ref="entryTravel"
                :class="{ 'is-entering': entering }"
              >
                <div
                  class="float-rig"
                  :class="{
                    'is-sharing': stackOpen,
                    'is-pressed': stackPressed,
                    'is-entering': entering,
                  }"
                >
                  <div class="card-pressure" ref="pressure">
                    <div
                      class="identity-stack"
                      ref="stack"
                      :style="{
                        '--turn-x': `${turnX}deg`,
                        '--turn-y': `${turnY}deg`,
                      }"
                      :class="{
                        'is-open': stackOpen,
                        'has-interacted': stackUsed,
                        'has-copied': copiedValue === shareUrl,
                        'is-pressed': stackPressed,
                        'is-turning': turning,
                        'is-entering': entering,
                      }"
                      role="button"
                      tabindex="0"
                      :aria-label="t.revealShare"
                      :aria-expanded="stackOpen"
                      @pointerdown="lastPointerType = $event.pointerType"
                      @focus="focusStack"
                      @blur="leaveStack()"
                      @keydown.enter.prevent="activateStack($event)"
                      @keydown.space.prevent="activateStack($event)"
                      @keydown.up.prevent="activateStack($event)"
                      @keydown.down.prevent="activateStack($event)"
                      @keydown.left.prevent="activateStack($event)"
                      @keydown.right.prevent="activateStack($event)"
                    >
                      <div
                        v-for="z in coreLayers"
                        :key="z"
                        class="card-core-layer"
                        :style="{ '--core-z': `${z}px` }"
                        aria-hidden="true"
                      ></div>
                      <div
                        class="identity-card identity-front"
                        ref="identity"
                        :aria-hidden="stackOpen"
                      >
                        <i
                          v-for="n in 4"
                          :key="n"
                          class="surface-probe"
                          :class="`probe-${n}`"
                          aria-hidden="true"
                        ></i>

                        <div class="identity-top">
                          <span class="micro-label">{{ t.card }}</span
                          ><span class="identity-symbol" aria-hidden="true"
                            >✳</span
                          >
                        </div>
                        <div class="sculpture" aria-hidden="true">
                          <span
                            v-if="rippleKey"
                            :key="rippleKey"
                            class="avatar-ripple"
                          ></span
                          ><AvatarImage
                            v-if="config.avatar"
                            class="sculpture-avatar"
                            :src="asset(config.avatar)"
                            :fallback="config.monogram"
                          /><template v-else
                            ><span class="sculpture-shadow">{{
                              config.monogram
                            }}</span
                            ><span class="sculpture-letter"
                              >{{ config.monogram }}<i>.</i></span
                            ></template
                          >
                        </div>
                        <div class="identity-bottom">
                          <div class="identity-owner">
                            <AvatarImage
                              v-if="config.avatar"
                              class="mini-avatar"
                              :src="asset(config.avatar)"
                              :fallback="config.monogram"
                            /><span v-else class="mini-avatar">{{
                              config.monogram
                            }}</span>
                            <div>
                              <strong>{{ config.name }}</strong
                              ><span>{{ t.available }}</span>
                            </div>
                          </div>
                          <span class="identity-qr" aria-hidden="true"
                            ><Icon name="qr"
                          /></span>
                        </div>
                        <div class="identity-edge">
                          <span>DK CONNECT</span><span>01 — ∞</span>
                        </div>
                      </div>
                      <div
                        class="identity-card identity-share"
                        :aria-hidden="!stackOpen"
                      >
                        <i
                          v-for="n in 4"
                          :key="n"
                          class="surface-probe"
                          :class="`probe-${n}`"
                          aria-hidden="true"
                        ></i>

                        <div class="identity-top">
                          <span class="micro-label">{{ t.share }}</span
                          ><Icon name="arrow" />
                        </div>
                        <div class="stack-qr">
                          <img
                            v-if="stackQr && !stackQrFailed"
                            :src="stackQr"
                            :alt="t.qr"
                            draggable="false"
                            @error="stackQrFailed = true"
                          /><span v-else>{{
                            stackQrFailed ? t.qrFail : "···"
                          }}</span>
                        </div>
                        <div class="stack-share-caption">
                          <strong>{{ config.name }}</strong
                          ><span>{{ t.scan }}</span>
                        </div>
                        <div class="identity-edge">
                          <span>DK CONNECT</span
                          ><span
                            ><Icon name="arrow" /> {{ t.revealShare }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span
              class="stage-coordinate coordinate-bottom stage-ambient"
              aria-hidden="true"
              ><span class="tiny-cross">+</span> LESS DISTANCE. MORE
              CONNECTION.</span
            >
          </div>
        </section>
        <section
          class="connections"
          id="connections"
          aria-labelledby="connections-title"
          style="--delay: 1320ms"
        >
          <div class="section-bar" ref="sectionBar" :class="{ 'is-entering': entering }"><div class="section-bar-inner"><span class="section-index">01 /</span><span class="section-bar-title">{{ language === 'zh' ? '我的数字坐标' : 'My digital coordinates' }}</span></div></div>
          <div class="section-header" ref="sectionHeader" :class="{ 'is-entering': entering }">
            <div>
              <h2 id="connections-title">{{ t.connect }}</h2>
            </div>
            <p class="section-hint">{{ t.hint }}</p>
          </div>
          <SocialGrid
            :cards="config.cards"
            :t="t"
            :text="text"
            :copied-value="copiedValue"
            @open="openCard"
            @copy="copy"
          />
        </section>
        <section id="share-section" class="share-strip reveal" style="--delay: 420ms">
          <div class="share-decoration" aria-hidden="true">✳</div>
          <div class="share-copy">
            <h2>{{ t.shareTitle }}</h2>
            <p>{{ t.shareBody }}</p>
          </div>
          <button class="secondary-button" @click="showShare">
            <Icon name="qr" /><span>{{ t.share }}</span
            ><Icon name="arrow" />
          </button>
        </section>
        <a v-if="!entering && !hasScrolled" class="scroll-cue" href="#connections" :aria-label="t.contact"><span>{{ language === 'zh' ? '向下探索' : 'Scroll to explore' }}</span><span class="scroll-cue-arrow" aria-hidden="true">↓</span></a>
      </main>
      <footer id="site-footer">
        <a href="#top" :aria-label="t.back" class="footer-wordmark"
          >h<span>.</span></a
        ><span
          >© {{ year }} {{ config.name }}<span class="footer-divider">/</span
          >{{ t.footer }}</span
        ><span class="footer-credit">BUILT WITH DK CONNECT <span>↗</span></span>
      </footer>
    </div>
    <Transition name="modal"
      ><div v-if="modalOpen" class="modal-backdrop" @click.self="close">
        <section
          ref="modal"
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <button
            class="icon-button close-button"
            @click="close"
            :aria-label="t.close"
          >
            <Icon name="close" /></button
          ><SharePanel
            :handle="config.handle"
            :name="config.name"
            :t="t"
            :text="text"
            :share-open="shareOpen"
            :selected="selected"
            :qr-data="qrData"
            :qr-failed="qrFailed"
            :share-url="shareUrl"
            :copied-value="copiedValue"
            :local-preview="localPreview"
            :poster-busy="posterBusy"
            :poster-url="posterUrl"
            @copy="copy"
            @poster="makePoster"
            @qr-error="qrFailed = true"
          />
        </section></div
    ></Transition>
    <Teleport to="body"
      ><Transition name="cursor-hint"
        ><div
          v-if="cursorHint"
          class="cursor-copy-hint"
          :style="{ left: cursor.x + 'px', top: cursor.y + 'px' }"
          aria-hidden="true"
        >
          <Icon name="arrow" />{{ flipHint }}
        </div></Transition
      ></Teleport
    >
    <Transition name="toast"
      ><div v-if="toast" class="toast-message" role="status">
        <span>✓</span>{{ toast }}
      </div></Transition
    >
  </div>
</template>
