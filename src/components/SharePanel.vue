<script setup lang="ts">
import Icon from "../Icon.vue";
import type { Localized, SocialCard } from "../config";
import type { Words } from "../i18n";
defineProps<{
  handle: string;
  name: string;
  t: Words;
  text: (value: Localized) => string;
  shareOpen: boolean;
  selected: SocialCard | null;
  qrData: string;
  qrFailed: boolean;
  shareUrl: string;
  copiedValue: string;
  localPreview: boolean;
  posterBusy: boolean;
  posterUrl: string;
}>();
defineEmits<{ copy: [value: string]; poster: []; qrError: [] }>();
</script>
<template>
  <p class="eyebrow">{{ handle }}</p>
  <h2 id="dialog-title">
    {{ shareOpen ? t.share : selected ? text(selected.name) : "" }}
  </h2>
  <p class="modal-description">
    {{ shareOpen ? t.scan : selected?.url ? t.confirmVisit : selected?.account ? t.manual : t.unsetBody }}
  </p>
  <div
    v-if="qrData && !qrFailed"
    class="qr-frame"
    :class="{ 'qr-frame-original': selected?.id === 'telegram' }"
  >
    <img
      :src="qrData"
      :alt="shareOpen ? t.qr : selected ? text(selected.name) : ''"
      @error="$emit('qrError')"
    />
  </div>
  <div v-else-if="!shareOpen && !selected?.account" class="empty-contact">
    <Icon :name="selected?.icon || 'globe'" /><span>{{ t.unset }}</span>
  </div>
  <a v-if="!shareOpen && selected?.url" class="primary-button contact-confirm" :href="selected.url" :target="selected.url.startsWith('http') ? '_blank' : undefined" rel="noopener noreferrer">{{ t.visit }} {{ text(selected.name) }}<Icon name="arrow" /></a>
  <p v-if="qrFailed && shareOpen" class="modal-description">{{ t.qrFail }}</p>
  <p v-if="shareOpen || selected?.account" class="account-line">
    {{ shareOpen ? shareUrl : selected?.account }}
  </p>
  <button
    v-if="shareOpen || selected?.account"
    class="primary-button modal-copy"
    @click="$emit('copy', shareOpen ? shareUrl : selected!.account)"
  >
    <Icon
      :name="
        copiedValue === (shareOpen ? shareUrl : selected?.account)
          ? 'check'
          : 'copy'
      "
    />{{
      copiedValue === (shareOpen ? shareUrl : selected?.account)
        ? t.copied
        : shareOpen
          ? t.copyLink
          : t.copy
    }}</button
  ><template v-if="shareOpen"
    ><p v-if="localPreview" class="local-preview-note">{{ t.localPreview }}</p>
    <button
      class="secondary-button poster-button"
      @click="$emit('poster')"
      :disabled="posterBusy"
    >
      <Icon name="download" />{{ posterBusy ? t.creating : t.poster }}
    </button>
    <div v-if="posterUrl" class="poster-preview">
      <img :src="posterUrl" :alt="`${name} — ${t.poster}`" /><a
        class="primary-button"
        :href="posterUrl"
        :download="`${name}-card.png`"
        ><Icon name="download" />{{ t.download }}</a
      >
    </div></template
  >
</template>
