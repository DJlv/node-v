<template>
  <div class="iframe-utils">
    <iframe
      v-if="!failed"
      class="iframe-utils__frame"
      :src="src"
      :style="frameStyle"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      @load="onLoad"
      @error="failed = true"
    />
    <div v-else class="iframe-utils__error">
      页面无法加载：{{ urls }}
      <a :href="src" target="_blank" rel="noopener">在新窗口打开</a>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    urls: { type: String, required: true },
    height: { type: [String, Number], default: 600 },
  },
  data() {
    return {
      failed: false,
      loaded: false,
    };
  },
  computed: {
    src() {
      return String(this.urls || "").trim();
    },
    frameStyle() {
      const h = Number(this.height);
      return {
        height: Number.isFinite(h) && h > 0 ? `${h}px` : String(this.height),
      };
    },
  },
  watch: {
    urls() {
      this.failed = false;
      this.loaded = false;
    },
  },
  methods: {
    onLoad() {
      this.loaded = true;
    },
  },
};
</script>

<style scoped>
.iframe-utils {
  width: 100%;
  margin: 1rem 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 6%, transparent);
}

.iframe-utils__frame {
  display: block;
  width: 100%;
  border: none;
  background: var(--vp-c-bg);
}

.iframe-utils__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 200px;
  padding: 1rem;
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  font-size: 14px;
}

.iframe-utils__error a {
  color: var(--vp-c-brand-1);
}
</style>
