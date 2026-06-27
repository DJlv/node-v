<script setup lang="ts">
import { useRoute } from 'vitepress'
import { computed } from 'vue'
import { useData } from '../composables/data'
import { useSidebar } from '../composables/sidebar'
import VPDocAside from './VPDocAside.vue'
import VPDocFooter from './VPDocFooter.vue'

const { theme } = useData()

const route = useRoute()
const { hasSidebar, hasAside, leftAside } = useSidebar()

const pageName = computed(() =>
  route.path.replace(/[./]+/g, '_').replace(/_html$/, '')
)
</script>

<template>
  <div
    class="VPDoc"
    :class="{ 'has-sidebar': hasSidebar, 'has-aside': hasAside }"
  >
    <slot name="doc-top" />
    <div class="container">
      <div v-if="hasAside" class="aside" :class="{ 'left-aside': leftAside }">
        <aside class="doc-aside-panel">
          <nav class="doc-aside-nav" aria-label="文章目录">
            <VPDocAside>
              <template #aside-top><slot name="aside-top" /></template>
              <template #aside-bottom><slot name="aside-bottom" /></template>
              <template #aside-outline-before><slot name="aside-outline-before" /></template>
              <template #aside-outline-after><slot name="aside-outline-after" /></template>
              <template #aside-ads-before><slot name="aside-ads-before" /></template>
              <template #aside-ads-after><slot name="aside-ads-after" /></template>
            </VPDocAside>
          </nav>
          <div class="doc-aside-fade" aria-hidden="true" />
        </aside>
      </div>

      <div class="content">
        <div class="content-container">
          <slot name="doc-before" />
          <main class="main">
            <Content
              class="vp-doc"
              :class="[
                pageName,
                theme.externalLinkIcon && 'external-link-icon-enabled'
              ]"
            />
          </main>
          <VPDocFooter>
            <template #doc-footer-before><slot name="doc-footer-before" /></template>
          </VPDocFooter>
          <slot name="doc-after" />
        </div>
      </div>
    </div>
    <slot name="doc-bottom" />
  </div>
</template>

<style scoped>
.VPDoc {
  padding: 32px 24px 96px;
  width: 100%;
}

@media (min-width: 768px) {
  .VPDoc {
    padding: 48px 32px 128px;
  }
}

@media (min-width: 960px) {
  .VPDoc {
    padding: 48px 32px 0;
  }

  .VPDoc:not(.has-sidebar) .container {
    display: flex;
    justify-content: center;
    max-width: 992px;
  }

  .VPDoc:not(.has-sidebar) .content {
    max-width: 752px;
  }
}

@media (min-width: 1280px) {
  .VPDoc .container {
    display: flex;
    justify-content: flex-start;
    max-width: 100%;
  }

  .VPDoc .aside {
    display: block;
  }

  .VPDoc.has-aside .content {
    flex: 1 1 auto;
    min-width: 0;
    max-width: none;
    padding: 0 20px 128px;
  }

  .VPDoc.has-aside .content-container {
    max-width: none;
    width: 100%;
  }
}

@media (min-width: 1440px) {
  .VPDoc:not(.has-sidebar) .content {
    max-width: 784px;
  }

  .VPDoc:not(.has-sidebar) .container {
    max-width: 1104px;
  }
}

.container {
  margin: 0 auto;
  width: 100%;
}

/* 文档流占位：仅保留目录列宽度，不参与背景绘制 */
.aside {
  position: relative;
  display: none;
  order: 2;
  flex: 0 0 var(--vp-aside-width, 280px);
  width: 100%;
  max-width: var(--vp-aside-width, 280px);
}

.left-aside {
  order: 1;
}

/*
 * 右侧目录面板：对齐左侧 VPSidebar 模式
 * fixed + top/bottom 撑满视口，单一背景层，避免多层叠加产生色差
 */
.doc-aside-panel {
  display: none;
}

@media (min-width: 1280px) {
  .doc-aside-panel {
    position: fixed;
    top: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px));
    z-index: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: var(--vp-aside-width, 280px);
    height: calc(100vh - var(--vp-nav-height) - var(--vp-layout-top-height, 0px));
    height: calc(100dvh - var(--vp-nav-height) - var(--vp-layout-top-height, 0px));
    background-color: var(--vp-doc-aside-bg, var(--vp-c-bg-alt));
    border-left: 1px solid var(--vp-c-divider);
    overflow: hidden;
    pointer-events: none;
  }

  .doc-aside-nav,
  .doc-aside-fade {
    pointer-events: auto;
  }
}

.doc-aside-nav {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 48px 16px 32px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.doc-aside-nav::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.doc-aside-fade {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  height: 32px;
  background: linear-gradient(transparent, var(--vp-doc-aside-bg, var(--vp-c-bg-alt)) 70%);
  pointer-events: none;
}

.content {
  position: relative;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 960px) {
  .content {
    padding: 0 32px 128px;
  }
}

@media (min-width: 1280px) {
  .content {
    order: 1;
    margin: 0;
    min-width: 0;
    flex: 1 1 auto;
  }
}

.content-container {
  margin: 0 auto;
  width: 100%;
}

.VPDoc.has-aside .content-container {
  max-width: none;
  width: 100%;
}

.external-link-icon-enabled :is(.vp-doc a[href*='://'], .vp-doc a[target='_blank'])::after {
  content: '';
  color: currentColor;
}
</style>
