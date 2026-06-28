<template>
  <Teleport to="body" :disabled="!expanded">
    <div class="svg-utils" :class="{ 'svg-utils--expanded': expanded }">
      <div v-if="expanded" class="svg-utils__lightbox-bar">
        <span class="svg-utils__lightbox-title">SVG 预览</span>
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
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  data() {
    return {
      dragging: false,
      pointerX: 0,
      pointerY: 0,
      originLeft: 0,
      originTop: 0,
      scale: 1,
      expanded: false,
    };
  },
  computed: {
    scalePercent() {
      return Math.round(this.scale * 100);
    },
    canvasStyle() {
      return {
        transform: `scale(${this.scale})`,
        transformOrigin: "0 0",
      };
    },
  },
  watch: {
    expanded(value) {
      if (value) {
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", this.onExpandedKeydown);
      } else {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", this.onExpandedKeydown);
      }
    },
  },
  mounted() {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    document.addEventListener("mousemove", this.onPointerMove);
    document.addEventListener("mouseup", this.onPointerUp);
  },
  beforeUnmount() {
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("mouseup", this.onPointerUp);
    document.removeEventListener("keydown", this.onExpandedKeydown);
    document.body.style.overflow = "";
  },
  methods: {
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
  overflow: auto;
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

.svg-utils__canvas :deep(svg) {
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
