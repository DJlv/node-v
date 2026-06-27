<template>
  <ElImage style="width: 100%;" :src="url" :preview-src-list="srcList" />
</template>

<script>
import { ElImage } from "element-plus";
import "element-plus/es/components/image/style/css";

export default {
  components: { ElImage },
  props: ["urls"],
  computed: {
    url() {
      const base = import.meta.env.BASE_URL || "/";
      const file = String(this.urls || "").replace(/^\//, "");
      return `${base}${file}`;
    },
    srcList() {
      return [this.url];
    },
  },
};
</script>

<style scoped>
:deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 20px auto;
}
</style>
