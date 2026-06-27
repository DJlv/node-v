<template>
  <img
    class="img-utils"
    :src="url"
    :alt="alt"
    loading="lazy"
    @click="openPreview"
  />
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

export default {
  props: {
    urls: { type: String, required: true },
    alt: { type: String, default: "" },
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
  methods: {
    openPreview() {
      if (typeof window !== "undefined") {
        window.open(this.url, "_blank", "noopener,noreferrer");
      }
    },
  },
};
</script>

<style scoped>
.img-utils {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px auto;
  cursor: zoom-in;
  border-radius: 6px;
}
</style>
