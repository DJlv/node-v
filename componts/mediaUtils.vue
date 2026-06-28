<template>
  <figure class="media-utils">
    <video
      v-if="kind === 'video' && !failed"
      class="media-utils__player"
      :src="url"
      controls
      preload="metadata"
      @error="failed = true"
    />
    <audio
      v-else-if="kind === 'audio' && !failed"
      class="media-utils__player media-utils__player--audio"
      :src="url"
      controls
      preload="metadata"
      @error="failed = true"
    />
    <figcaption v-if="caption && !failed" class="media-utils__caption">
      {{ caption }}
    </figcaption>
    <figcaption v-if="failed" class="media-utils__error">
      媒体文件无法加载：{{ urls }}
    </figcaption>
  </figure>
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

export default {
  props: {
    urls: { type: String, required: true },
    kind: { type: String, default: "video" },
    caption: { type: String, default: "" },
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
  },
  watch: {
    urls() {
      this.failed = false;
    },
  },
};
</script>

<style scoped>
.media-utils {
  margin: 1rem 0;
}

.media-utils__player {
  display: block;
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.media-utils__player--audio {
  width: 100%;
}

.media-utils__caption {
  margin-top: 0.5rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.media-utils__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 1rem;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 25%, transparent);
  border-radius: 8px;
  font-size: 14px;
}
</style>
