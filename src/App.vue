<script setup lang="ts">
import { ref } from "vue";
import { useMotionBudget } from "./composables/useMotionBudget";
const pageShell = ref<HTMLElement>();
useMotionBudget(pageShell);
import { usePageModel } from "./composables/usePageModel";
import TopBar from "./components/TopBar.vue";
import HeroSection from "./components/HeroSection.vue";
import SiteFooter from "./components/SiteFooter.vue";
import ShareDialog from "./components/ShareDialog.vue";
import SocialGrid from "./components/SocialGrid.vue";
import Icon from "./Icon.vue";
const model = usePageModel();
const {
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
} = model;
</script>
<template>
  <div class="page-shell" id="top" ref="pageShell">
    <div class="atmosphere" aria-hidden="true"></div>
    <div class="layout">
      <div class="topbar-space" aria-hidden="true"></div>
      <TopBar :model="model" />
      <main>
        <HeroSection :model="model" />
        <section
          class="connections"
          id="connections"
          aria-labelledby="connections-title"
          style="--delay: 1320ms"
        >
          <div
            class="section-bar"
            ref="sectionBar"
            :class="{ 'is-entering': entering }"
          >
            <div class="section-bar-inner">
              <span class="section-index">01 /</span
              ><span class="section-bar-title">{{ t.sectionTitle }}</span>
            </div>
          </div>
          <div
            class="section-header"
            ref="sectionHeader"
            :class="{ 'is-entering': entering }"
          >
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
        <section
          id="share-section"
          class="share-strip reveal"
          style="--delay: 420ms"
        >
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
        <a
          v-if="!entering && !hasScrolled"
          class="scroll-cue"
          href="#connections"
          :aria-label="t.contact"
          ><span>{{ t.scrollExplore }}</span
          ><span class="scroll-cue-arrow" aria-hidden="true">↓</span></a
        >
      </main>
      <SiteFooter :model="model" />
    </div>
    <ShareDialog :model="model" />
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
