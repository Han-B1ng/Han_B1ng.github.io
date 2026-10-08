<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  check: 'm5 12 4 4L19 6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  arrow: 'M7 17 17 7M7 7h10v10',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z',
  share: 'M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
  close: 'm6 6 12 12M6 18 18 6',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3h-3v-3m9-3v3',
  qq: 'M7 15c-1-2-1-6 0-8 2-5 8-5 10 0 1 2 1 6 0 8m-10-5c-5 7-3 9-1 6m11-6c5 7 3 9 1 6M6 16c1 5 11 5 12 0M8 20l-2 1m10-1 2 1M9 9h.01M15 9h.01m-5 3h4',
  github: 'M9 19c-4 1-4-2-6-2m14 5v-4c0-1-.4-2-1-2 4-.5 6-2 6-6 0-2-.6-3-2-4 .3-1 .3-2 0-3-2 0-3 1-4 1-2-.5-4-.5-6 0-1 0-2-1-4-1-.3 1-.3 2 0 3-1.4 1-2 2-2 4 0 4 2 5.5 6 6-.6 0-1 1-1 2v4',
  x: 'M4 3h4l12 18h-4L4 3Zm16 0L4 21',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-1h.01',
  douyin: 'M14 2v13a5 5 0 1 1-4-5m4-8c1 4 4 6 7 6',
  feishu: 'M4 15 18 5l3 4-14 10-4-1 1-3Zm4-7 8-5m-4 15-5 3',
  telegram: 'm21 3-4 18-6-5-4 3v-6L21 3 2 10l5 3m0 0 10-6-6 9',
  wechat: 'M14 14c0 4-7 6-10 3l-3 1 1-3C-2 9 3 4 8 4c5 0 9 4 7 8M22 19l1 3-3-1c-4 2-10 0-10-4 0-3 3-5 7-5s7 3 5 7M5 9h.01M10 9h.01M14 16h.01M19 16h.01',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.globe" /></svg></template>
