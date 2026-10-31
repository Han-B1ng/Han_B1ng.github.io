<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import Icon from "../Icon.vue";
import type { Localized, SocialCard } from "../config";
import type { Words } from "../i18n";
defineProps<{
  cards: SocialCard[];
  t: Words;
  text: (value: Localized) => string;
  copiedValue: string;
}>();
defineEmits<{ open: [card: SocialCard]; copy: [value: string] }>();
const root = ref<HTMLElement>();
const desktopQuery = window.matchMedia("(min-width: 761px)");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopGate = ref(desktopQuery.matches && !motionQuery.matches);
const revealed = ref(window.scrollY > 4 || motionQuery.matches);
const columns = ref(5);
let observer: IntersectionObserver | undefined;
let topTimer: ReturnType<typeof setTimeout> | undefined;
function spotlight(event: PointerEvent) {
  if (motionQuery.matches) return;
  const el = event.currentTarget as HTMLElement,
    rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}
function reveal() {
  clearTimeout(topTimer);
  topTimer = undefined;
  revealed.value = true;
}
function wheel(event: WheelEvent) {
  if (
    event.deltaY > 0 &&
    !event.ctrlKey &&
    !document.querySelector('[role="dialog"]')
  )
    reveal();
}
function scroll() {
  if (window.scrollY > 4) {
    reveal();
    return;
  }
  if (window.scrollY <= 2 && desktopGate.value && revealed.value && !topTimer) {
    topTimer = setTimeout(() => {
      topTimer = undefined;
      if (
        window.scrollY <= 2 &&
        desktopGate.value &&
        !document.querySelector('[role="dialog"]')
      )
        revealed.value = false;
    }, 180);
  }
}
function measureColumns() {
  if (root.value)
    columns.value = getComputedStyle(root.value).gridTemplateColumns.split(
      " ",
    ).length;
}
function configure() {
  clearTimeout(topTimer);
  topTimer = undefined;
  observer?.disconnect();
  desktopGate.value = desktopQuery.matches && !motionQuery.matches;
  measureColumns();
  const cards = root.value?.querySelectorAll(".social-card");
  cards?.forEach((card) => card.classList.remove("scroll-enter", "in-view"));
  if (motionQuery.matches) {
    reveal();
    return;
  }
  if (desktopQuery.matches) {
    scroll();
    return;
  }
  // Mobile keeps only a normal, once-per-card viewport fade.
  if (!("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer?.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  cards?.forEach((card) => {
    card.classList.add("scroll-enter");
    observer?.observe(card);
  });
}
onMounted(() => {
  configure();
  window.addEventListener("wheel", wheel, { passive: true });
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", measureColumns);
  desktopQuery.addEventListener("change", configure);
  motionQuery.addEventListener("change", configure);
});
onBeforeUnmount(() => {
  clearTimeout(topTimer);
  observer?.disconnect();
  window.removeEventListener("wheel", wheel);
  window.removeEventListener("scroll", scroll);
  window.removeEventListener("resize", measureColumns);
  desktopQuery.removeEventListener("change", configure);
  motionQuery.removeEventListener("change", configure);
});
</script>
<template>
  <div
    class="social-grid"
    ref="root"
    :class="{ 'is-desktop-gated': desktopGate, 'is-revealed': revealed }"
    :inert="desktopGate && !revealed"
  >
    <article
      v-for="(card, index) in cards"
      :key="card.id"
      class="social-card"
      :style="{
        '--stagger': `${Math.floor(index / columns) * 65 + (index % columns) * 20}ms`,
      }"
      @pointermove="spotlight"
      @pointerdown="spotlight"
    >
      <div class="social-top">
        <span class="social-icon"><Icon :name="card.icon" /></span
        ><span class="card-number">{{
          String(index + 1).padStart(2, "0")
        }}</span>
      </div>
      <div class="social-body">
        <h3>{{ text(card.name) }}</h3>
        <p>{{ text(card.subtitle) }}</p>
      </div>
      <div class="social-bottom">
        <span class="social-status">{{ card.account || t.pending }}</span
        ><button
          v-if="card.url && card.qrImage"
          class="card-link card-qr-link"
          @click="$emit('open', card)"
          :aria-label="`${t.viewQr} ${text(card.name)}`"
        >
          <Icon name="qr" /></button
        ><button
          v-if="card.url"
          class="card-link"
          @click="$emit('open', card)"
          :aria-label="`${t.details} ${text(card.name)}`"
          ><Icon name="arrow" /></button
        ><button
          v-else
          class="card-link"
          :disabled="!card.account && !card.qrImage"
          @click="$emit('open', card)"
          :aria-label="`${t.details} ${text(card.name)}`"
        >
          <Icon name="arrow" />
        </button>
      </div>
      <button
        v-if="card.account && card.copy"
        class="card-copy"
        @click="$emit('copy', card.account)"
        :aria-label="`${t.copy} ${text(card.name)}`"
      >
        <Icon :name="copiedValue === card.account ? 'check' : 'copy'" />
      </button>
    </article>
  </div>
</template>
