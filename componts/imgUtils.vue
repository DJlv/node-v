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
export default {
  props: {
    urls: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  computed: {
    url() {
      const base = import.meta.env.BASE_URL || "/";
      const file = String(this.urls || "").replace(/^\//, "");
      const encoded = file
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      return `${base}${encoded}`;
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
