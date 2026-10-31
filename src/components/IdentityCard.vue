<script setup lang="ts">
import type { usePageModel } from "../composables/usePageModel";
import Icon from "../Icon.vue";
import AvatarImage from "./AvatarImage.vue";
const props = defineProps<{ model: ReturnType<typeof usePageModel> }>();
const {
  startSweepWithAura,
  t,
  shareUrl,
  identity,
  stack,
  pressure,
  entryTravel,
  stackOpen,
  stackUsed,
  stackPressed,
  turnX,
  turnY,
  turning,
  coreLayers,
  entering,
  entranceReady,
  orbitStartOne,
  orbitStartTwo,
  stackQr,
  stackQrFailed,
  lastPointerType,
  moveStack,
  enterStack,
  leaveStack,
  activateStack,
  focusStack,
  asset,
  copiedValue,
  rippleKey,
  config,
} = props.model;
</script>
<template>
  <div
    class="identity-stage"
    :class="{
      'is-entering': entering,
      'is-entry-ready': entranceReady,
      'is-turning-stage': turning,
    }"
    :style="{
      '--orbit-start-1': orbitStartOne,
      '--orbit-start-2': orbitStartTwo,
    }"
  >
    <div class="orbital orbital-one" aria-hidden="true"></div>
    <div class="orbital orbital-two" aria-hidden="true"></div>
    <div
      class="motion-aura"
      aria-hidden="true"
      @animationstart="startSweepWithAura"
    ></div>
    <div class="ground-shadow stage-ambient" aria-hidden="true"></div>
    <div class="orbit-front" aria-hidden="true"></div>
    <span
      class="stage-coordinate coordinate-top stage-ambient"
      aria-hidden="true"
      >PERSONAL IDENTITY — 001</span
    >
    <div
      class="float-anchor"
      @click="activateStack"
      @pointerenter="enterStack"
      @pointermove="moveStack"
      @pointerleave="leaveStack"
    >
      <div
        class="card-entry-travel"
        ref="entryTravel"
        :class="{ 'is-entering': entering }"
      >
        <div
          class="float-rig"
          :class="{
            'is-sharing': stackOpen,
            'is-pressed': stackPressed,
            'is-entering': entering,
          }"
        >
          <div class="card-pressure" ref="pressure">
            <div
              class="identity-stack"
              ref="stack"
              :style="{
                '--turn-x': `${turnX}deg`,
                '--turn-y': `${turnY}deg`,
              }"
              :class="{
                'is-open': stackOpen,
                'has-interacted': stackUsed,
                'has-copied': copiedValue === shareUrl,
                'is-pressed': stackPressed,
                'is-turning': turning,
                'is-entering': entering,
              }"
              role="button"
              tabindex="0"
              :aria-label="t.revealShare"
              :aria-expanded="stackOpen"
              @pointerdown="lastPointerType = $event.pointerType"
              @focus="focusStack"
              @blur="leaveStack()"
              @keydown.enter.prevent="activateStack($event)"
              @keydown.space.prevent="activateStack($event)"
              @keydown.up.prevent="activateStack($event)"
              @keydown.down.prevent="activateStack($event)"
              @keydown.left.prevent="activateStack($event)"
              @keydown.right.prevent="activateStack($event)"
            >
              <div
                v-for="z in coreLayers"
                :key="z"
                class="card-core-layer"
                :style="{ '--core-z': `${z}px` }"
                aria-hidden="true"
              ></div>
              <div
                class="identity-card identity-front"
                ref="identity"
                :aria-hidden="stackOpen"
              >
                <i
                  v-for="n in 4"
                  :key="n"
                  class="surface-probe"
                  :class="`probe-${n}`"
                  aria-hidden="true"
                ></i>

                <div class="identity-top">
                  <span class="micro-label">{{ t.card }}</span
                  ><span class="identity-symbol" aria-hidden="true">✳</span>
                </div>
                <div class="sculpture" aria-hidden="true">
                  <span
                    v-if="rippleKey"
                    :key="rippleKey"
                    class="avatar-ripple"
                  ></span
                  ><AvatarImage
                    v-if="config.avatar"
                    class="sculpture-avatar"
                    :src="asset(config.avatar)"
                    :fallback="config.monogram"
                  /><template v-else
                    ><span class="sculpture-shadow">{{ config.monogram }}</span
                    ><span class="sculpture-letter"
                      >{{ config.monogram }}<i>.</i></span
                    ></template
                  >
                </div>
                <div class="identity-bottom">
                  <div class="identity-owner">
                    <AvatarImage
                      v-if="config.avatar"
                      class="mini-avatar"
                      :src="asset(config.avatar)"
                      :fallback="config.monogram"
                    /><span v-else class="mini-avatar">{{
                      config.monogram
                    }}</span>
                    <div>
                      <strong>{{ config.name }}</strong
                      ><span>{{ t.available }}</span>
                    </div>
                  </div>
                  <span class="identity-qr" aria-hidden="true"
                    ><Icon name="qr"
                  /></span>
                </div>
                <div class="identity-edge">
                  <span>DK CONNECT</span><span>01 — ∞</span>
                </div>
              </div>
              <div
                class="identity-card identity-share"
                :aria-hidden="!stackOpen"
              >
                <i
                  v-for="n in 4"
                  :key="n"
                  class="surface-probe"
                  :class="`probe-${n}`"
                  aria-hidden="true"
                ></i>

                <div class="identity-top">
                  <span class="micro-label">{{ t.share }}</span
                  ><Icon name="arrow" />
                </div>
                <div class="stack-qr">
                  <img
                    v-if="stackQr && !stackQrFailed"
                    :src="stackQr"
                    :alt="t.qr"
                    draggable="false"
                    @error="stackQrFailed = true"
                  /><span v-else>{{ stackQrFailed ? t.qrFail : "···" }}</span>
                </div>
                <div class="stack-share-caption">
                  <strong>{{ config.name }}</strong
                  ><span>{{ t.scan }}</span>
                </div>
                <div class="identity-edge">
                  <span>DK CONNECT</span
                  ><span><Icon name="arrow" /> {{ t.revealShare }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <span
      class="stage-coordinate coordinate-bottom stage-ambient"
      aria-hidden="true"
      ><span class="tiny-cross">+</span> LESS DISTANCE. MORE CONNECTION.</span
    >
  </div>
</template>
