<script setup lang="ts">
import type { usePageModel } from "../composables/usePageModel";
import Icon from "../Icon.vue";
import SharePanel from "./SharePanel.vue";
const props = defineProps<{ model: ReturnType<typeof usePageModel> }>();
const {
  text,
  t,
  selected,
  shareOpen,
  modalOpen,
  qrData,
  qrFailed,
  shareUrl,
  localPreview,
  modal,
  copy,
  close,
  copiedValue,
  posterUrl,
  posterBusy,
  makePoster,
  config,
} = props.model;
</script>
<template>
  <Transition name="modal"
    ><div v-if="modalOpen" class="modal-backdrop" @click.self="close">
      <section
        ref="modal"
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          class="icon-button close-button"
          @click="close"
          :aria-label="t.close"
        >
          <Icon name="close" /></button
        ><SharePanel
          :handle="config.handle"
          :name="config.name"
          :t="t"
          :text="text"
          :share-open="shareOpen"
          :selected="selected"
          :qr-data="qrData"
          :qr-failed="qrFailed"
          :share-url="shareUrl"
          :copied-value="copiedValue"
          :local-preview="localPreview"
          :poster-busy="posterBusy"
          :poster-url="posterUrl"
          @copy="copy"
          @poster="makePoster"
          @qr-error="qrFailed = true"
        />
      </section></div
  ></Transition>
</template>
