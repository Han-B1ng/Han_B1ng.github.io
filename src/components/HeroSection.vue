<script setup lang="ts">
import type { usePageModel } from "../composables/usePageModel";
import Icon from "../Icon.vue";
import IdentityCard from "./IdentityCard.vue";
const props = defineProps<{ model: ReturnType<typeof usePageModel> }>();
const { text, t, heroCopy, entering, config } = props.model;
</script>
<template>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy" ref="heroCopy" :class="{ 'is-revealing': entering }">
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
    <IdentityCard :model="model" />
  </section>
</template>
