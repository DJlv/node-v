<template>
  <figure class="img-utils">
    <img
      v-if="!failed"
      class="img-utils__image"
      :src="url"
      :alt="alt"
      loading="lazy"
      @click="openLightbox"
      @error="failed = true"
    />
    <figcaption v-if="failed" class="img-utils__error">
      图片未找到或无法加载：{{ urls }}
    </figcaption>
    <figcaption v-else-if="showCaption" class="img-utils__caption">
      {{ alt }}
    </figcaption>

    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="img-utils__lightbox"
        @click.self="closeLightbox"
      >
        <button type="button" class="img-utils__close" @click="closeLightbox">×</button>
        <img class="img-utils__lightbox-image" :src="url" :alt="alt" />
        <p v-if="showCaption" class="img-utils__lightbox-caption">{{ alt }}</p>
      </div>
    </Teleport>
  </figure>
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

export default {
  props: {
    urls: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  data() {
    return {
      failed: false,
      lightboxOpen: false,
    };
  },
  computed: {
    url() {
      return buildDocsAssetUrl(
        this.urls,
        import.meta.env.BASE_URL || "/",
        import.meta.env.DEV,
      );
    },
    showCaption() {
      if (!this.alt) return false;
      const base = this.urls.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
      return this.alt !== base;
    },
  },
  watch: {
    urls() {
      this.failed = false;
    },
    url() {
      this.failed = false;
    },
  },
  mounted() {
    this.onKeydown = (event) => {
      if (event.key === "Escape") this.closeLightbox();
    };
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.onKeydown);
    document.body.style.overflow = "";
  },
  methods: {
    openLightbox() {
      this.lightboxOpen = true;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", this.onKeydown);
    },
    closeLightbox() {
      this.lightboxOpen = false;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", this.onKeydown);
    },
  },
};
</script>

<style scoped>
.img-utils {
  width: 100%;
  margin: 1rem 0;
}

.img-utils__image {
  width: 100%;
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
  cursor: zoom-in;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.img-utils__caption {
  margin-top: 0.5rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.img-utils__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 1rem;
  margin: 0;
  text-align: center;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-danger-1) 25%, transparent);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.img-utils__lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: color-mix(in srgb, var(--vp-c-bg) 15%, rgba(0, 0, 0, 0.82));
  backdrop-filter: blur(4px);
}

.img-utils__lightbox-image {
  max-width: min(96vw, 1400px);
  max-height: 82vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.img-utils__lightbox-caption {
  margin-top: 1rem;
  color: #fff;
  font-size: 14px;
  text-align: center;
}

.img-utils__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-bg) 80%, transparent);
  color: var(--vp-c-text-1);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
</style>
