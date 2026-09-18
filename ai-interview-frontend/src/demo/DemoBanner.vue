<template>
  <span v-if="DEMO_MODE" class="demo-chip" :title="t('demo.hint')">
    <span class="demo-dot" />
    <span class="demo-chip-text">{{ t('demo.title') }}</span>
    <span class="demo-chip-text-short">{{ t('demo.titleShort') }}</span>
    <button class="demo-reset" type="button" :title="t('demo.hint')" @click="resetDemo">{{ t('demo.resetShort') }}</button>
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { DEMO_MODE, resetDemo } from '../demo'

const { t } = useI18n()
</script>

<style scoped>
/*
 * 顶栏内联的演示标记，而不是固定在角落的浮层。
 *
 * 早先的版本固定在左下角，实测会压住页脚，以及面试页的答题输入区
 * （1024px 宽下重叠约 1.3 万像素²，手机宽度下约 1.7 万像素²）。
 * 而「面试页」用 min-height: calc(100vh - 72px) 把输入区钉在视口底部，
 * 靠给 body 加内边距无法把它顶上去——底部浮层在这个布局里必然遮挡内容。
 * 因此改为占用顶栏自身的空间：零遮挡、零布局位移。
 */
.demo-chip { display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 5px 6px 5px 9px; border: 1px solid var(--border-strong); border-radius: 999px; background: var(--bg-soft); }
.demo-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: var(--warning); }
.demo-chip-text { color: var(--text-soft); font-size: 11px; font-weight: 700; white-space: nowrap; }
.demo-chip-text-short { display: none; color: var(--text-soft); font-size: 11px; font-weight: 700; white-space: nowrap; }
.demo-reset { padding: 4px 8px; border: 1px solid var(--border); border-radius: 999px; color: var(--text-soft); background: var(--bg-elevated); font-size: 10px; cursor: pointer; white-space: nowrap; }
.demo-reset:hover { color: var(--text); background: var(--bg-hover); }
/*
 * 窄屏只收起重置按钮，保留「演示」二字：仅剩一个圆点会让访客看不出这是演示版，
 * 而演示性质必须始终可被看到。
 */
@media (max-width: 860px) { .demo-chip-text { display: none; } .demo-chip-text-short { display: inline; } .demo-reset { display: none; } }
</style>
