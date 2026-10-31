<script setup lang="ts">
import type { usePageModel } from "../composables/usePageModel";
import Icon from "../Icon.vue";
const props = defineProps<{ model: ReturnType<typeof usePageModel> }>();
const {
  language,
  theme,
  scrolled,
  scrollProgress,
  headerIdentity,
  sweepHandoff,
  startupSweep,
  finishSweep,
  toggleLanguage,
  t,
  topbar,
  share,
  toggleTheme,
  config,
} = props.model;
</script>
<template>
  <header
    class="topbar topbar-drop"
    :class="{ 'is-scrolled': scrolled }"
    ref="topbar"
  >
    <a class="brand" href="#top" :aria-label="t.home"
      ><span class="brand-mark">h<span>.</span></span
      ><span
        >{{ config.name
        }}<span class="brand-sub"
          ><Transition name="header-identity" mode="out-in"
            ><span :key="headerIdentity">{{ headerIdentity }}</span></Transition
          ></span
        ></span
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
    <div
      class="header-track"
      :class="{
        'is-active': scrolled,
        'is-starting': startupSweep,
        'is-handoff': sweepHandoff,
      }"
      :style="{ '--scroll-progress': scrollProgress }"
      aria-hidden="true"
    >
      <span class="header-glow"></span
      ><span
        v-if="startupSweep"
        class="startup-glow"
        @animationend="finishSweep"
      ></span>
    </div>
  </header>
</template>
