import { computed, ref, onBeforeUnmount, type Ref } from "vue";
import QRCode from "qrcode";
import { words } from "../i18n";
import { getCardZone, surfacePoint, type CardZone } from "../cardGeometry";
import type { Language } from "../config";
export function useIdentityCard(context: {
  language: Ref<Language>;
  shareUrl: string;
  reducedMotion: () => boolean;
}) {
  const { language, shareUrl, reducedMotion } = context;
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
  const orbitStartOne = ref(`${Math.floor(Math.random() * 360)}deg`);
  const orbitStartTwo = ref(`${Math.floor(Math.random() * 360)}deg`);
  let flipTimer: ReturnType<typeof setTimeout> | undefined;
  const flipHint = computed(() => {
    const hints = words[language.value].flipHints;
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
  const lastPointerType = ref("mouse");
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
      const point = surfacePoint(
        points,
        pointerPosition!.x,
        pointerPosition!.y,
      );
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
    if (lastPointerType.value !== "mouse") {
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
    lastPointerType.value = event.pointerType;
    if (!stack.value?.closest(".float-anchor")?.contains(event.target as Node))
      leaveStack();
  }
  function resetTilt() {
    pressure.value?.style.setProperty("--rx", "0deg");
    pressure.value?.style.setProperty("--ry", "0deg");
    stack.value?.style.setProperty("--light-x", "40%");
    stack.value?.style.setProperty("--light-y", "20%");
  }

  const rippleKey = ref(0);

  function stopCardMotion() {
    clearTimeout(flipTimer);
    turning.value = false;
    leaveStack();
  }
  onBeforeUnmount(() => {
    stopCardMotion();
    clearTimeout(hoverTimer);
    cancelAnimationFrame(lightFrame);
  });
  return {
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
  };
}
