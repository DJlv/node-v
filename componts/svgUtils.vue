<template>
  <Teleport to="body" :disabled="!expanded">
    <div class="svg-utils" :class="{ 'svg-utils--expanded': expanded }">
      <div v-if="useXlsx && loading" class="svg-utils__status">
        <span class="svg-utils__spinner" aria-hidden="true" />
        正在加载图表数据…
      </div>

      <div v-else-if="useXlsx && error" class="svg-utils__status svg-utils__status--error">
        {{ error }}
      </div>

      <template v-else>
      <div v-if="expanded" class="svg-utils__lightbox-bar">
        <span class="svg-utils__lightbox-title">{{ lightboxTitle }}</span>
        <div class="svg-utils__zoom-group">
          <button type="button" class="svg-utils__btn" title="缩小" @click="zoomOut">−</button>
          <span class="svg-utils__scale">{{ scalePercent }}%</span>
          <button type="button" class="svg-utils__btn" title="放大" @click="zoomIn">+</button>
          <button type="button" class="svg-utils__btn" title="重置" @click="resetView">重置</button>
        </div>
        <button
          type="button"
          class="svg-utils__btn svg-utils__btn--close"
          title="关闭 (Esc)"
          @click="closeExpanded"
        >
          关闭
        </button>
      </div>

      <div v-if="!expanded" class="svg-utils__toolbar">
        <button type="button" class="svg-utils__btn" title="缩小" @click="zoomOut">−</button>
        <span class="svg-utils__scale">{{ scalePercent }}%</span>
        <button type="button" class="svg-utils__btn" title="放大" @click="zoomIn">+</button>
        <button type="button" class="svg-utils__btn" title="重置" @click="resetView">重置</button>
        <button
          type="button"
          class="svg-utils__btn svg-utils__btn--expand"
          title="全屏放大查看"
          @click="openExpanded"
        >
          放大
        </button>
      </div>

      <div
        class="svg-utils__content"
        :class="{ 'svg-utils__content--expanded': expanded }"
      >
        <div
          ref="viewportRef"
          class="svg-utils__viewport"
          :class="{ 'svg-utils__viewport--expanded': expanded, 'svg-utils__viewport--dragging': dragging }"
          @wheel.prevent="onWheel"
          @dblclick="resetView"
        >
          <div
            ref="canvasRef"
            class="svg-utils__canvas"
            :style="canvasStyle"
            @mousedown="onPointerDown"
          >
            <div
              v-if="useXlsx"
              ref="generatedRef"
              class="svg-utils__generated"
            />
            <slot v-else />
          </div>
        </div>
      </div>
      </template>
    </div>
  </Teleport>
</template>

<script>
import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";
import { loadXlsxWorkbook } from "../utils/load-xlsx-workbook.js";
import { parseDiagramFromWorkbook } from "../utils/xlsx-diagram-parser.js";
import { renderDiagramSvg } from "../utils/render-diagram-svg.js";

export default {
  props: {
    urls: { type: String, default: "" },
    sheetName: { type: String, default: "" },
  },
  data() {
    return {
      dragging: false,
      pointerX: 0,
      pointerY: 0,
      originLeft: 0,
      originTop: 0,
      scale: 1,
      expanded: false,
      loading: false,
      error: "",
      generatedSvg: "",
      activeSheet: "",
    };
  },
  computed: {
    useXlsx() {
      return Boolean(String(this.urls || "").trim());
    },
    lightboxTitle() {
      if (this.useXlsx) {
        const base = this.urls.split("/").pop()?.replace(/\.[^.]+$/, "") || "图表";
        return this.activeSheet ? `${base} · ${this.activeSheet}` : base;
      }
      return "SVG 预览";
    },
    scalePercent() {
      return Math.round(this.scale * 100);
    },
    canvasStyle() {
      return {
        transform: `scale(${this.scale})`,
        transformOrigin: "0 0",
      };
    },
    excelUrl() {
      return buildDocsAssetUrl(
        this.urls,
        import.meta.env.BASE_URL || "/",
        import.meta.env.DEV,
      );
    },
  },
  watch: {
    urls() {
      this.loadDiagram();
    },
    sheetName() {
      this.loadDiagram();
    },
    generatedSvg() {
      this.$nextTick(() => this.paintGeneratedSvg());
    },
    expanded(value) {
      if (value) {
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", this.onExpandedKeydown);
      } else {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", this.onExpandedKeydown);
      }
      if (this.useXlsx && this.generatedSvg) {
        this.$nextTick(() => this.fitToViewport());
      }
    },
  },
  created() {
    if (this.useXlsx) this.loading = true;
  },
  mounted() {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    document.addEventListener("mousemove", this.onPointerMove);
    document.addEventListener("mouseup", this.onPointerUp);
    if (this.useXlsx) this.loadDiagram();
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("mouseup", this.onPointerUp);
    document.removeEventListener("keydown", this.onExpandedKeydown);
    document.body.style.overflow = "";
  },
  methods: {
    async loadDiagram() {
      if (!this.useXlsx) return;

      this.loading = true;
      this.error = "";
      this.generatedSvg = "";
      this.activeSheet = "";
      this.clearGeneratedSvg();

      try {
        const { workbook, sheetNames, xlsx, buffer } = await loadXlsxWorkbook(
          this.excelUrl,
          this.urls,
        );
        const preferred =
          this.sheetName && sheetNames.includes(this.sheetName)
            ? this.sheetName
            : sheetNames[0];
        this.activeSheet = preferred;
        const diagram = parseDiagramFromWorkbook(workbook, xlsx, preferred, buffer);
        this.generatedSvg = renderDiagramSvg(diagram);
      } catch (err) {
        this.error = err?.message || "图表数据加载失败";
        this.clearGeneratedSvg();
      } finally {
        this.loading = false;
      }
    },

    clearGeneratedSvg() {
      const host = this.$refs.generatedRef;
      if (host) host.replaceChildren();
    },

    paintGeneratedSvg() {
      const host = this.$refs.generatedRef;
      if (!host) return;

      host.replaceChildren();
      if (!this.generatedSvg) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(this.generatedSvg, "image/svg+xml");
      if (doc.querySelector("parsererror")) {
        this.error = "SVG 渲染失败，请检查 xlsx 数据格式";
        return;
      }

      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== "svg") {
        this.error = "SVG 渲染失败，请检查 xlsx 数据格式";
        return;
      }

      host.appendChild(document.importNode(svg, true));
      this.$nextTick(() => this.fitToViewport());
    },

    findStartAnchor(svg) {
      const rootId = svg.getAttribute("data-root-id");
      if (!rootId) return null;

      const rect = svg.querySelector(`[data-node-id="${rootId}"] rect`);
      if (!rect) return null;

      return {
        x: Number.parseFloat(rect.getAttribute("x")) || 0,
        y: Number.parseFloat(rect.getAttribute("y")) || 0,
        height: Number.parseFloat(rect.getAttribute("height")) || 0,
      };
    },

    fitToViewport() {
      const viewport = this.$refs.viewportRef;
      const canvas = this.$refs.canvasRef;
      const host = this.$refs.generatedRef;
      if (!viewport) return;

      const svg = host?.querySelector("svg") || canvas?.querySelector("svg");
      if (!svg) return;

      const viewBox = svg.viewBox?.baseVal;
      const svgWidth = Number.parseFloat(svg.getAttribute("width")) || svg.getBBox().width;
      const svgHeight = Number.parseFloat(svg.getAttribute("height")) || svg.getBBox().height;
      if (!svgWidth || !svgHeight) return;

      const pad = 24;
      const canvasPad = 12;
      const availW = Math.max(viewport.clientWidth - pad * 2, 1);
      const availH = Math.max(viewport.clientHeight - pad * 2, 1);
      const fitScale = Math.min(availW / svgWidth, availH / svgHeight, 1);

      this.scale = Math.max(0.3, Math.round(fitScale * 100) / 100);

      if (!canvas) return;

      const scale = this.scale;
      const vbX = viewBox?.x || 0;
      const vbY = viewBox?.y || 0;
      const vbWidth = viewBox?.width || svgWidth;
      const vbHeight = viewBox?.height || svgHeight;
      const mapX = svgWidth / vbWidth;
      const mapY = svgHeight / vbHeight;
      const start = this.findStartAnchor(svg);

      if (start) {
        const anchorX = (start.x - vbX) * mapX;
        const anchorCenterY = (start.y + start.height / 2 - vbY) * mapY;
        canvas.style.left = `${Math.round(pad - scale * (canvasPad + anchorX))}px`;
        canvas.style.top = `${Math.round(viewport.clientHeight / 2 - scale * (canvasPad + anchorCenterY))}px`;
        return;
      }

      const scaledW = svgWidth * scale;
      const scaledH = svgHeight * scale;
      canvas.style.left = `${Math.round(Math.max(pad, (viewport.clientWidth - scaledW) / 2))}px`;
      canvas.style.top = `${Math.round(Math.max(pad, (viewport.clientHeight - scaledH) / 2))}px`;
    },

    readOffset(el) {
      const left = getComputedStyle(el).left;
      const top = getComputedStyle(el).top;
      return {
        left: left === "auto" ? 0 : Number.parseInt(left, 10) || 0,
        top: top === "auto" ? 0 : Number.parseInt(top, 10) || 0,
      };
    },

    onPointerDown(event) {
      if (event.button !== 0) return;
      const canvas = this.$refs.canvasRef;
      if (!canvas) return;
      const { left, top } = this.readOffset(canvas);
      this.originLeft = left;
      this.originTop = top;
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      this.dragging = true;
      event.preventDefault();
    },

    onPointerMove(event) {
      if (!this.dragging) return;
      const canvas = this.$refs.canvasRef;
      if (!canvas) return;
      const deltaX = event.clientX - this.pointerX;
      const deltaY = event.clientY - this.pointerY;
      canvas.style.left = `${this.originLeft + deltaX}px`;
      canvas.style.top = `${this.originTop + deltaY}px`;
      event.preventDefault();
    },

    onPointerUp() {
      this.dragging = false;
    },

    onWheel(event) {
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.scale = Math.min(3, Math.max(0.3, this.scale + delta));
    },

    zoomIn() {
      this.scale = Math.min(3, Math.round((this.scale + 0.15) * 100) / 100);
    },

    zoomOut() {
      this.scale = Math.max(0.3, Math.round((this.scale - 0.15) * 100) / 100);
    },

    resetView() {
      if (this.useXlsx) {
        this.fitToViewport();
        return;
      }

      this.scale = 1;
      const canvas = this.$refs.canvasRef;
      if (canvas) {
        canvas.style.left = "0px";
        canvas.style.top = "0px";
      }
    },

    openExpanded() {
      this.expanded = true;
    },

    closeExpanded() {
      this.expanded = false;
    },

    onExpandedKeydown(event) {
      if (event.key === "Escape") this.closeExpanded();
    },
  },
};
</script>

<style scoped>
.svg-utils {
  width: 100%;
  margin: 1rem 0;
}

.svg-utils__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 160px;
  padding: 1.5rem;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.svg-utils__status--error {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border-color: color-mix(in srgb, var(--vp-c-danger-1) 25%, transparent);
}

.svg-utils__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: svg-utils-spin 0.7s linear infinite;
}

@keyframes svg-utils-spin {
  to {
    transform: rotate(360deg);
  }
}

.svg-utils__toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.svg-utils__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 14px;
}

.svg-utils__btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.svg-utils__btn--expand {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  color: var(--vp-c-brand-1);
}

.svg-utils__scale {
  min-width: 48px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.svg-utils--expanded {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 16px 20px 20px;
  box-sizing: border-box;
  width: auto;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: color-mix(in srgb, var(--vp-c-bg) 88%, transparent);
  backdrop-filter: blur(10px);
}

.svg-utils__lightbox-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.svg-utils__lightbox-title {
  flex: 1 1 120px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.svg-utils__zoom-group {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.svg-utils__btn--close {
  margin-left: auto;
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  color: var(--vp-c-brand-1);
}

.svg-utils__content--expanded {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.svg-utils__viewport {
  overflow: hidden;
  white-space: nowrap;
  height: 600px;
  width: 100%;
  cursor: grab;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background-color: var(--vp-c-bg-soft);
  background-image:
    linear-gradient(
      45deg,
      color-mix(in srgb, var(--vp-c-divider) 35%, transparent) 25%,
      transparent 25%,
      transparent 75%,
      color-mix(in srgb, var(--vp-c-divider) 35%, transparent) 75%
    ),
    linear-gradient(
      45deg,
      color-mix(in srgb, var(--vp-c-divider) 35%, transparent) 25%,
      transparent 25%,
      transparent 75%,
      color-mix(in srgb, var(--vp-c-divider) 35%, transparent) 75%
    );
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 6%, transparent);
}

.svg-utils__viewport--expanded {
  flex: 1 1 0;
  min-height: 0;
  height: auto;
}

.svg-utils__viewport--dragging {
  cursor: grabbing;
  user-select: none;
}

.svg-utils__canvas {
  position: relative;
  display: inline-block;
  min-width: min-content;
  padding: 12px;
}

.svg-utils__canvas :deep(svg),
.svg-utils__generated :deep(svg) {
  display: block;
  max-width: none;
}
</style>

<!-- 全屏 overlay 需覆盖 scoped 限制 -->
<style>
.svg-utils.svg-utils--expanded {
  height: 100vh !important;
  height: 100dvh !important;
}

.svg-utils.svg-utils--expanded .svg-utils__content--expanded {
  flex: 1 1 0 !important;
  min-height: 0 !important;
}

.svg-utils.svg-utils--expanded .svg-utils__viewport--expanded {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
}
</style>
