<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useData } from "vitepress";
import VPFeatures from "./VPFeatures.vue";
import { homeFeaturesMap } from "virtual:home-features-map";

const { frontmatter: fm } = useData();
const route = useRoute();

/** 仅一级 section 的 /docs/{section}/home 显示卡片 */
const featuresKey = computed(() => {
  const parts = route.path.split("/").filter(Boolean);
  const docsIdx = parts.indexOf("docs");
  if (docsIdx === -1) return "";

  const sectionParts = parts.slice(docsIdx);
  if (sectionParts.length === 3 && sectionParts[2] === "home") {
    return sectionParts[1];
  }

  return "";
});

const features = computed(() => {
  const fromFrontmatter = fm.value.features;
  if (Array.isArray(fromFrontmatter) && fromFrontmatter.length > 0) {
    return fromFrontmatter;
  }
  if (!featuresKey.value) return [];
  return homeFeaturesMap[featuresKey.value] ?? [];
});
</script>

<template>
  <VPFeatures
    v-if="features.length"
    class="VPHomeFeatures"
    :features="features"
  />
</template>
