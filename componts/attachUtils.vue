<template>
  <a
    class="attach-utils"
    :href="url"
    :download="fileName"
    target="_blank"
    rel="noopener"
  >
    <span class="attach-utils__icon" aria-hidden="true">📎</span>
    <span class="attach-utils__name">{{ label || fileName }}</span>
  </a>
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

export default {
  props: {
    urls: { type: String, required: true },
    label: { type: String, default: "" },
  },
  computed: {
    url() {
      return buildDocsAssetUrl(
        this.urls,
        import.meta.env.BASE_URL || "/",
        import.meta.env.DEV,
      );
    },
    fileName() {
      const parts = String(this.urls || "").split("/");
      return parts[parts.length - 1] || "download";
    },
  },
};
</script>

<style scoped>
.attach-utils {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  padding: 0.65rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}

.attach-utils:hover {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-soft) 50%, var(--vp-c-bg-soft));
}

.attach-utils__name {
  font-size: 14px;
  word-break: break-all;
}
</style>
