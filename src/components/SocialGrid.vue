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
let observer: IntersectionObserver | undefined;
function spotlight(event: PointerEvent) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = event.currentTarget as HTMLElement,
    rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}
onMounted(() => {
  if (
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer?.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  root.value?.querySelectorAll(".social-card").forEach((el) => {
    el.classList.add("scroll-enter");
    observer?.observe(el);
  });
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div class="social-grid" ref="root">
    <article
      v-for="(card, index) in cards"
      :key="card.id"
      class="social-card"
      :style="{ '--stagger': `${(index % 5) * 65}ms` }"
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
        ><a
          v-if="card.url"
          class="card-link"
          :href="card.url"
          :target="card.url.startsWith('http') ? '_blank' : undefined"
          rel="noopener noreferrer"
          :aria-label="`${t.visit} ${text(card.name)}`"
          ><Icon name="arrow" /></a
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
