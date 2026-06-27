<!-- 从 public 目录读取 Excel 并渲染为表格 -->
<template>
  <div class="table-utils">
    <div v-if="loading" class="table-utils__status">
      <span class="table-utils__spinner" aria-hidden="true" />
      正在加载表格…
    </div>

    <div v-else-if="error" class="table-utils__status table-utils__status--error">
      {{ error }}
    </div>

    <div v-else-if="!rows.length" class="table-utils__status">
      工作表「{{ sheetName }}」暂无数据
    </div>

    <div v-else class="table-utils__frame">
      <!-- 内容区：禁止任何滚动条，横向位移由底部滚动条驱动 -->
      <div ref="mainRef" class="table-utils__main">
        <div class="table-utils__head-clip">
          <div class="table-utils__clip-inner">
            <div class="table-utils__pan" :style="panStyle">
              <table
                ref="headTableRef"
                class="table-utils__table table-utils__table--head"
                :class="{ 'table-utils__table--synced': colSynced }"
                :style="tableStyle"
              >
                <colgroup>
                  <col
                    v-for="(width, index) in colWidths"
                    :key="`hc-${index}`"
                    :style="colStyle(width)"
                  />
                </colgroup>
                <thead>
                  <tr>
                    <th v-for="(col, index) in headers" :key="`h-${index}`">
                      {{ formatCell(col) }}
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>

        <div ref="bodyWrapRef" class="table-utils__body-clip">
          <div ref="bodyYRef" class="table-utils__body-y" @wheel="onBodyWheel">
            <div class="table-utils__body-sizer">
              <div class="table-utils__clip-inner">
                <div class="table-utils__pan" :style="panStyle">
                  <table
                    ref="bodyTableRef"
                    class="table-utils__table table-utils__table--body"
                    :class="{ 'table-utils__table--synced': colSynced }"
                    :style="tableStyle"
                  >
                    <colgroup>
                      <col
                        v-for="(width, index) in colWidths"
                        :key="`bc-${index}`"
                        :style="colStyle(width)"
                      />
                    </colgroup>
                    <tbody>
                      <tr v-for="(row, rowIndex) in rows" :key="`r-${rowIndex}`">
                        <td v-for="(cell, colIndex) in row" :key="`c-${rowIndex}-${colIndex}`">
                          {{ formatCell(cell) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全表唯一可见横向滚动条 -->
      <div
        ref="hScrollRef"
        class="table-utils__hscroll"
        :class="{ 'table-utils__hscroll--idle': !hasHorizontalScroll }"
        @scroll="onHScroll"
      >
        <div ref="hScrollInnerRef" class="table-utils__hscroll-inner" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import * as xlsx from "xlsx";

export default {
  props: {
    urls: { type: String, required: true },
    sheetName: { type: String, required: true },
  },
  data() {
    return {
      loading: true,
      error: "",
      headers: [],
      rows: [],
      colWidths: [],
      scrollX: 0,
      hasHorizontalScroll: false,
      syncingScroll: false,
      resizeObserver: null,
    };
  },
  computed: {
    excelUrl() {
      const base = import.meta.env.BASE_URL || "/";
      const file = this.urls.replace(/^\//, "");
      return `${base}${file}`;
    },
    colSynced() {
      return this.colWidths.length === this.headers.length && this.colWidths.length > 0;
    },
    tableTotalWidth() {
      if (!this.colSynced) return 0;
      return this.colWidths.reduce((sum, width) => sum + width, 0);
    },
    tableStyle() {
      if (!this.colSynced) return undefined;
      const width = `${this.tableTotalWidth}px`;
      return { width, minWidth: width };
    },
    panStyle() {
      return { transform: `translate3d(-${this.scrollX}px, 0, 0)` };
    },
  },
  watch: {
    rows() {
      this.colWidths = [];
      this.$nextTick(() => this.updateLayout());
    },
    headers() {
      this.colWidths = [];
      this.$nextTick(() => this.updateLayout());
    },
  },
  mounted() {
    this.loadSheet();
    this.resizeObserver = new ResizeObserver(() => this.updateLayout());
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  methods: {
    formatCell(value) {
      if (value === null || value === undefined) return "";
      const text = String(value).trim();
      return text === "" ? "—" : text;
    },

    colStyle(width) {
      return width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined;
    },

    observeTargets() {
      const main = this.$refs.mainRef;
      const bodyWrap = this.$refs.bodyWrapRef;
      const bodyTable = this.$refs.bodyTableRef;
      if (!this.resizeObserver) return;
      this.resizeObserver.disconnect();
      if (main) this.resizeObserver.observe(main);
      if (bodyWrap) this.resizeObserver.observe(bodyWrap);
      if (bodyTable) this.resizeObserver.observe(bodyTable);
    },

    measureColWidths() {
      const headTable = this.$refs.headTableRef;
      const bodyTable = this.$refs.bodyTableRef;
      if (!headTable || !bodyTable || !this.headers.length) return false;

      const colCount = this.headers.length;
      const widths = Array(colCount).fill(0);

      headTable.querySelectorAll("thead th").forEach((cell, index) => {
        widths[index] = Math.max(widths[index], cell.offsetWidth);
      });

      bodyTable.querySelectorAll("tbody tr").forEach((row) => {
        row.querySelectorAll("td").forEach((cell, index) => {
          widths[index] = Math.max(widths[index], cell.offsetWidth);
        });
      });

      const next = widths.map((width) => Math.max(Math.ceil(width), 48));
      const changed =
        next.length !== this.colWidths.length ||
        next.some((width, index) => width !== this.colWidths[index]);

      if (changed) {
        this.colWidths = next;
      }
      return changed;
    },

    syncScrollMetrics() {
      const main = this.$refs.mainRef;
      const bodyTable = this.$refs.bodyTableRef;
      const inner = this.$refs.hScrollInnerRef;
      const hScroll = this.$refs.hScrollRef;
      if (!main || !bodyTable || !inner) return;

      const contentWidth = this.colSynced
        ? this.tableTotalWidth
        : bodyTable.scrollWidth;

      inner.style.width = `${contentWidth}px`;
      this.hasHorizontalScroll = contentWidth > main.clientWidth + 1;
      this.observeTargets();

      const maxScroll = Math.max(0, contentWidth - main.clientWidth);
      if (this.scrollX > maxScroll) {
        this.scrollX = maxScroll;
      }

      if (hScroll) {
        this.syncingScroll = true;
        hScroll.scrollLeft = this.scrollX;
        this.syncingScroll = false;
      }
    },

    updateLayout() {
      this.$nextTick(() => {
        const widthChanged = this.measureColWidths();

        const finalize = () => {
          if (this.colSynced) {
            this.measureColWidths();
          }
          this.syncScrollMetrics();
        };

        if (widthChanged) {
          this.$nextTick(finalize);
        } else {
          finalize();
        }
      });
    },

    scrollHorizontal(delta) {
      const main = this.$refs.mainRef;
      if (!main || !this.hasHorizontalScroll) return;

      const contentWidth = this.colSynced
        ? this.tableTotalWidth
        : this.$refs.bodyTableRef?.scrollWidth || 0;
      const maxScroll = Math.max(0, contentWidth - main.clientWidth);
      this.scrollX = Math.min(maxScroll, Math.max(0, this.scrollX + delta));

      const hScroll = this.$refs.hScrollRef;
      if (hScroll) {
        this.syncingScroll = true;
        hScroll.scrollLeft = this.scrollX;
        this.syncingScroll = false;
      }
    },

    onHScroll() {
      if (this.syncingScroll) return;
      const hScroll = this.$refs.hScrollRef;
      if (!hScroll) return;
      this.scrollX = hScroll.scrollLeft;
    },

    onBodyWheel(event) {
      if (!this.hasHorizontalScroll) return;

      const horizontal =
        event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (!horizontal) return;

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

      this.scrollHorizontal(delta);
      event.preventDefault();
    },

    async loadSheet() {
      this.loading = true;
      this.error = "";
      this.headers = [];
      this.rows = [];
      this.colWidths = [];
      this.scrollX = 0;

      try {
        const response = await axios.get(this.excelUrl, {
          responseType: "arraybuffer",
        });

        const workbook = xlsx.read(response.data, { type: "array" });
        const matchedSheet = workbook.SheetNames.find(
          (name) => name === this.sheetName,
        );

        if (!matchedSheet) {
          this.error = `未找到工作表「${this.sheetName}」，可用：${workbook.SheetNames.join("、") || "无"}`;
          return;
        }

        const sheet = workbook.Sheets[matchedSheet];
        const jsonData = xlsx.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
        });

        if (!jsonData.length) return;

        const [headerRow, ...bodyRows] = jsonData;
        this.headers = headerRow.map((cell) => this.formatCell(cell));
        this.rows = bodyRows
          .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
          .map((row) => {
            const cells = [...row];
            while (cells.length < this.headers.length) cells.push("");
            return cells.slice(0, this.headers.length).map((cell) => this.formatCell(cell));
          });

        this.$nextTick(() => this.updateLayout());
      } catch (err) {
        this.error = `表格加载失败：${err?.message || "请检查文件路径与网络"}`;
      } finally {
        this.loading = false;
        if (this.rows.length) {
          this.$nextTick(() => this.updateLayout());
        }
      }
    },
  },
};
</script>

<style scoped>
.table-utils {
  margin: 1rem 0;
  font-size: 14px;
  line-height: 1.5;
}

.table-utils__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 120px;
  padding: 1.5rem;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.table-utils__status--error {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
  border-color: color-mix(in srgb, var(--vp-c-danger-1) 25%, transparent);
}

.table-utils__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: table-utils-spin 0.7s linear infinite;
}

@keyframes table-utils-spin {
  to {
    transform: rotate(360deg);
  }
}

.table-utils__frame {
  display: flex;
  flex-direction: column;
  height: min(480px, 70vh);
  max-height: min(480px, 70vh);
  min-width: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 6%, transparent);
  overflow: hidden;
}

.table-utils__main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.table-utils__head-clip {
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
  overflow: clip;
  background-color: color-mix(in srgb, var(--vp-c-bg-soft) 55%, #fff 45%);
  border-bottom: 1px solid var(--vp-c-divider);
}

.table-utils__body-clip {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow: clip;
  position: relative;
}

.table-utils__body-y {
  position: absolute;
  inset: 0;
  overflow-x: clip;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.table-utils__body-y::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.table-utils__body-sizer {
  width: 100%;
  overflow: clip;
  contain: inline-size;
}

.table-utils__clip-inner {
  width: 100%;
  max-width: 100%;
  overflow: clip;
  contain: inline-size;
}

.table-utils__pan {
  display: block;
  width: max-content;
  will-change: transform;
}

.table-utils__hscroll {
  flex: 0 0 auto;
  overflow-x: scroll;
  overflow-y: hidden;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.table-utils__hscroll--idle {
  height: 0;
  border: none;
  overflow: hidden;
  pointer-events: none;
}

.table-utils__hscroll-inner {
  height: 1px;
}

.table-utils__hscroll::-webkit-scrollbar {
  height: 10px;
}

.table-utils__hscroll::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
}

.table-utils__hscroll::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.table-utils__hscroll::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

.table-utils__table {
  border-collapse: separate;
  border-spacing: 0;
  white-space: nowrap;
  table-layout: auto;
}

.table-utils__table--synced {
  table-layout: fixed;
}

.table-utils__table--head thead th,
.table-utils__table--body tbody td {
  box-sizing: border-box;
  padding: 8px 14px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-utils__table--head thead th {
  font-weight: 600;
  color: var(--vp-c-text-1);
  background-color: color-mix(in srgb, var(--vp-c-bg-soft) 55%, #fff 45%);
}

.table-utils__table--body tbody td {
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
  background-color: var(--vp-c-bg);
}

.table-utils__table--body tbody tr:last-child td {
  border-bottom: none;
}

.table-utils__table--body tbody tr:nth-child(even) td {
  background-color: color-mix(in srgb, var(--vp-c-bg-soft) 60%, var(--vp-c-bg));
}

.table-utils__table--body tbody tr:hover td {
  background-color: var(--vp-c-default-soft);
}

@media (max-width: 640px) {
  .table-utils__table--head thead th,
  .table-utils__table--body tbody td {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>

<!-- 强制隐藏表格内部所有滚动条，仅保留底部 hscroll -->
<style>
.table-utils .table-utils__main,
.table-utils .table-utils__head-clip,
.table-utils .table-utils__body-clip,
.table-utils .table-utils__body-y,
.table-utils .table-utils__body-sizer,
.table-utils .table-utils__clip-inner,
.table-utils .table-utils__pan,
.table-utils .table-utils__table {
  overflow-x: clip !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.table-utils .table-utils__body-y {
  overflow-y: auto !important;
}

.table-utils .table-utils__main::-webkit-scrollbar,
.table-utils .table-utils__head-clip::-webkit-scrollbar,
.table-utils .table-utils__body-clip::-webkit-scrollbar,
.table-utils .table-utils__body-y::-webkit-scrollbar,
.table-utils .table-utils__body-sizer::-webkit-scrollbar,
.table-utils .table-utils__clip-inner::-webkit-scrollbar,
.table-utils .table-utils__pan::-webkit-scrollbar,
.table-utils .table-utils__table::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.table-utils .table-utils__hscroll {
  overflow-x: scroll !important;
  overflow-y: hidden !important;
  scrollbar-width: auto !important;
}

/* WebKit：隐藏 frame 内所有滚动条 */
.table-utils .table-utils__frame *::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
}

/* 仅底部 hscroll 显示横向滚动条 */
.table-utils .table-utils__hscroll::-webkit-scrollbar {
  width: auto !important;
  height: 10px !important;
}
</style>
