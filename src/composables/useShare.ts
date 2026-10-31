import { computed, ref, watch, onBeforeUnmount, type Ref } from "vue";
import QRCode from "qrcode";
import {
  config,
  type SocialCard,
  type Language,
  type Localized,
} from "../config";
import { createPoster } from "../poster";
import type { Words } from "../i18n";
export function useShare(context: {
  t: Ref<Words>;
  theme: Ref<"dark" | "light">;
  language: Ref<Language>;
  text: (value: Localized) => string;
  asset: (path: string) => string;
}) {
  const { t, theme, language, text, asset } = context;
  let timer: ReturnType<typeof setTimeout> | undefined;
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
  const copiedValue = ref("");
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  const posterUrl = ref("");
  const posterBusy = ref(false);
  let posterRevision = 0;
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

  onBeforeUnmount(() => {
    clearTimeout(timer);
    clearTimeout(copyTimer);
    clearPoster();
  });
  return {
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
  };
}
