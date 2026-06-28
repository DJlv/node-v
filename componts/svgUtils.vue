<template>
  <div class="svg-utils">
    <div class="svg-utils__toolbar">
      <button type="button" class="svg-utils__btn" title="缩小" @click="zoomOut">−</button>
      <span class="svg-utils__scale">{{ scalePercent }}%</span>
      <button type="button" class="svg-utils__btn" title="放大" @click="zoomIn">+</button>
      <button type="button" class="svg-utils__btn" title="重置" @click="resetView">重置</button>
      <button type="button" class="svg-utils__btn" title="全屏" @click="toggleFullscreen">⛶</button>
    </div>
    <div
      ref="viewportRef"
      class="svg-utils__viewport"
      :class="{ 'svg-utils__viewport--dragging': dragging }"
      @wheel.prevent="onWheel"
      @dblclick="resetView"
    >
      <div ref="canvasRef" class="svg-utils__canvas" :style="canvasStyle">
        <slot />
      </div>
    </div>
  </div>
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
      isFullscreen: false,
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
  mounted() {
    this.canvas = this.$refs.canvasRef;
    this.viewport = this.$refs.viewportRef;
    this.root = this.$el;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onFullscreenChange = this.onFullscreenChange.bind(this);

    this.canvas.addEventListener("mousedown", this.onPointerDown);
    document.addEventListener("mousemove", this.onPointerMove);
    document.addEventListener("mouseup", this.onPointerUp);
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
  },
  beforeUnmount() {
    this.canvas?.removeEventListener("mousedown", this.onPointerDown);
    document.removeEventListener("mousemove", this.onPointerMove);
    document.removeEventListener("mouseup", this.onPointerUp);
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
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
      const { left, top } = this.readOffset(this.canvas);
      this.originLeft = left;
      this.originTop = top;
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      this.dragging = true;
      event.preventDefault();
    },

    onPointerMove(event) {
      if (!this.dragging) return;
      const deltaX = event.clientX - this.pointerX;
      const deltaY = event.clientY - this.pointerY;
      this.canvas.style.left = `${this.originLeft + deltaX}px`;
      this.canvas.style.top = `${this.originTop + deltaY}px`;
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
      this.scale = Math.min(3, this.scale + 0.15);
    },

    zoomOut() {
      this.scale = Math.max(0.3, this.scale - 0.15);
    },

    resetView() {
      this.scale = 1;
      this.canvas.style.left = "0px";
      this.canvas.style.top = "0px";
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.root.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    },

    onFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
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

.svg-utils__scale {
  min-width: 48px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
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

.svg-utils:fullscreen {
  background: var(--vp-c-bg);
  padding: 1rem;
}

.svg-utils:fullscreen .svg-utils__viewport {
  height: calc(100vh - 4rem);
}
</style>
