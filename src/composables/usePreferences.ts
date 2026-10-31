import { ref, watch } from "vue";
import { config, type Language } from "../config";
export function usePreferences() {
  const language = ref<Language>(config.language);
  const theme = ref<"dark" | "light">(config.theme);
  try {
    const saved = JSON.parse(localStorage.getItem("dk-preferences") || "{}");
    if (saved.theme === "light" || saved.theme === "dark")
      theme.value = saved.theme;
    if (saved.language === "zh" || saved.language === "en")
      language.value = saved.language;
  } catch {
    /* Restricted storage uses config defaults. */
  }
  watch(
    [theme, language],
    () => {
      document.documentElement.dataset.theme = theme.value;
      document.documentElement.lang = language.value === "zh" ? "zh-CN" : "en";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          "content",
          theme.value === "dark" ? "#0b0c0e" : "#f3f2ef",
        );
      document.title = `${config.name} · Dk Connect`;
      try {
        localStorage.setItem(
          "dk-preferences",
          JSON.stringify({ theme: theme.value, language: language.value }),
        );
      } catch {
        /* Optional persistence. */
      }
    },
    { immediate: true },
  );
  return { language, theme };
}
