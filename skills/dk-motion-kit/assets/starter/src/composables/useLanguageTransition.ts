import { nextTick, type Ref } from "vue";
import type { Language } from "../config";
export function useLanguageTransition(
  language: Ref<Language>,
  reducedMotion: () => boolean,
) {
  let languageBusy = false;
  let languageDisposed = false;
  let languageAnimations: Animation[] = [];
  async function toggleLanguage() {
    if (languageBusy) return;
    if (reducedMotion()) {
      language.value = language.value === "zh" ? "en" : "zh";
      return;
    }
    languageBusy = true;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".hero-copy > *, .social-body, .social-status, .share-copy, .nav-share > span, .section-header > div, .section-hint, .stack-share-caption > span, .identity-top .micro-label, .identity-owner div > span, footer > span",
      ),
    );
    try {
      languageAnimations = nodes.map((node) =>
        node.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 90,
          fill: "forwards",
        }),
      );
      await Promise.all(
        languageAnimations.map((animation) => animation.finished),
      );
      if (languageDisposed) return;
      language.value = language.value === "zh" ? "en" : "zh";
      await nextTick();
      languageAnimations.forEach((animation) => animation.cancel());
      languageAnimations = nodes.map((node) =>
        node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 160,
          easing: "ease-out",
        }),
      );
      await Promise.all(
        languageAnimations.map((animation) => animation.finished),
      );
    } catch {
      /* Cancelled animations leave the current text visible. */
    } finally {
      languageAnimations.forEach((animation) => animation.cancel());
      languageAnimations = [];
      languageBusy = false;
    }
  }

  function disposeLanguage() {
    languageDisposed = true;
    languageAnimations.forEach((animation) => animation.cancel());
  }
  return { toggleLanguage, disposeLanguage };
}
