<script setup lang="ts">
import type { usePageModel } from "../composables/usePageModel";

const props = defineProps<{ model: ReturnType<typeof usePageModel> }>();
const { t, year, config } = props.model;
</script>
<template>
  <footer id="site-footer">
    <a href="#top" :aria-label="t.back" class="footer-wordmark"
      >h<span>.</span></a
    ><span
      >© {{ year }} {{ config.name }}<span class="footer-divider">/</span
      >{{ t.footer }}</span
    ><span class="footer-credit">BUILT WITH DK CONNECT <span>↗</span></span>
  </footer>
</template>
