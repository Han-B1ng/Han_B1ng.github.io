<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ src: string; fallback: string }>();
const state = ref<"loading" | "ready" | "error">("loading");
watch(
  () => props.src,
  () => (state.value = "loading"),
);
</script>
<template>
  <span class="avatar-image" :class="`avatar-${state}`"
    ><img
      v-if="state !== 'error'"
      :src="src"
      alt=""
      @load="state = 'ready'"
      @error="state = 'error'"
    /><span
      v-if="state !== 'ready'"
      class="avatar-placeholder"
      aria-hidden="true"
      >{{ fallback }}</span
    ></span
  >
</template>
