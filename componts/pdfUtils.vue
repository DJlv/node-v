<template>
  <figure class="pdf-utils">
    <iframe
      v-if="!failed"
      class="pdf-utils__frame"
      :src="frameUrl"
      :title="title || 'PDF 文档'"
      loading="lazy"
      @error="failed = true"
    />
    <figcaption v-if="title && !failed" class="pdf-utils__caption">{{ title }}</figcaption>
    <figcaption v-if="failed" class="pdf-utils__error">
      PDF 无法加载：{{ urls }}
      <a :href="url" target="_blank" rel="noopener">在新窗口打开</a>
    </figcaption>
  </figure>
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

export default {
  props: {
    urls: { type: String, required: true },
    title: { type: String, default: "" },
  },
  data() {
    return { failed: false };
  },
  computed: {
    url() {
      return buildDocsAssetUrl(
        this.urls,
        import.meta.env.BASE_URL || "/",
        import.meta.env.DEV,
      );
    },
    frameUrl() {
      return `${this.url}#view=FitH`;
    },
  },
  watch: {
    urls() {
      this.failed = false;
    },
  },
};
</script>

<style scoped>
.pdf-utils {
  margin: 1rem 0;
}

.pdf-utils__frame {
  display: block;
  width: 100%;
  height: 720px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
}

.pdf-utils__caption {
  margin-top: 0.5rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.pdf-utils__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-height: 120px;
  justify-content: center;
  padding: 1rem;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 25%, transparent);
  border-radius: 8px;
  font-size: 14px;
}

.pdf-utils__error a {
  color: var(--vp-c-brand-1);
}
</style>
