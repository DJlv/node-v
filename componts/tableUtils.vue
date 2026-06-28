<!-- 从 docs 同目录 excel 子目录读取 Excel 并渲染为表格 -->
<template>
  <div class="table-utils">
    <div v-if="loading" class="table-utils__status">
      <span class="table-utils__spinner" aria-hidden="true" />
      正在加载表格…
    </div>

    <div v-else-if="error" class="table-utils__status table-utils__status--error">
      {{ error }}
    </div>

    <template v-else>
      <div v-if="rows.length || sheetNames.length > 1" class="table-utils__toolbar">
        <input
          v-model="searchText"
          class="table-utils__search"
          type="search"
          placeholder="搜索表格…"
        />
        <button type="button" class="table-utils__btn" @click="exportCsv">
          导出 CSV
        </button>
        <label v-if="sheetNames.length > 1" class="table-utils__sheet-label">
          工作表
          <select
            v-model="activeSheet"
            class="table-utils__sheet-select"
            @change="onSheetChange"
          >
            <option v-for="name in sheetNames" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="!rows.length" class="table-utils__status">
        工作表「{{ activeSheet || sheetName }}」暂无数据
      </div>

      <div v-else class="table-utils__frame table-utils__frame--sticky">
      <!-- 内容区：禁止任何滚动条，横向位移由底部滚动条驱动 -->
      <div ref="mainRef" class="table-utils__main">
        <div class="table-utils__head-clip">
          <div class="table-utils__clip-inner">
            <div class="table-utils__pan" :style="panStyle">
              <table
                ref="headTableRef"
                class="table-utils__table table-utils__table--head"
                :style="tableStyle"
              >
                <colgroup>
                  <col
                    v-for="(header, index) in headers"
                    :key="`hc-${index}`"
                    :style="colStyle(colWidths[index])"
                  />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      v-for="(col, index) in headers"
                      :key="`h-${index}`"
                      :style="cellStyle(index)"
                      class="table-utils__th-sortable"
                      :class="{
                        'table-utils__th-sorted': sortCol === index,
                        'table-utils__cell-sticky': index === 0,
                      }"
                      @click="toggleSort(index)"
                    >
                      {{ formatCell(col) }}
                      <span v-if="sortCol === index" class="table-utils__sort-icon">
                        {{ sortAsc ? "↑" : "↓" }}
                      </span>
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
                    :style="tableStyle"
                  >
                    <colgroup>
                      <col
                        v-for="(header, index) in headers"
                        :key="`bc-${index}`"
                        :style="colStyle(colWidths[index])"
                      />
                    </colgroup>
                    <tbody>
                      <tr v-for="(row, rowIndex) in displayRows" :key="`r-${rowIndex}`">
                        <td
                          v-for="(cell, colIndex) in row"
                          :key="`c-${rowIndex}-${colIndex}`"
                          :style="cellStyle(colIndex)"
                          :class="{ 'table-utils__cell-sticky': colIndex === 0 }"
                        >
                          <a
                            v-if="isLink(cell)"
                            :href="cellHref(cell)"
                            target="_blank"
                            rel="noopener"
                            class="table-utils__link"
                          >{{ formatCell(cell) }}</a>
                          <template v-else>{{ formatCell(cell) }}</template>
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
    </template>
  </div>
</template>

<script>
import axios from "axios";

import { buildDocsAssetUrl } from "../utils/docs-asset-url.js";

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
      loadingSheet: false,
      xlsxLib: null,
      workbook: null,
      sheetNames: [],
      activeSheet: "",
      searchText: "",
      sortCol: -1,
      sortAsc: true,
    };
  },
  computed: {
    excelUrl() {
      return buildDocsAssetUrl(
        this.urls,
        import.meta.env.BASE_URL || "/",
        import.meta.env.DEV,
      );
    },
    colSynced() {
      return (
        this.colWidths.length === this.headers.length &&
        this.colWidths.length > 0 &&
        this.colWidths.every((width) => width > 0)
      );
    },
    tableTotalWidth() {
      if (!this.colSynced) return 0;
      return this.colWidths.reduce((sum, width) => sum + width, 0);
    },
    tableStyle() {
      if (!this.colSynced) return { width: "max-content" };
      const width = `${this.tableTotalWidth}px`;
      return { width, minWidth: width };
    },
    panStyle() {
      const style = { transform: `translate3d(-${this.scrollX}px, 0, 0)` };
      if (this.colSynced) {
        style.width = `${this.tableTotalWidth}px`;
      }
      return style;
    },
    displayRows() {
      let result = this.rows;
      const query = this.searchText.trim().toLowerCase();
      if (query) {
        result = result.filter((row) =>
          row.some((cell) => String(cell ?? "").toLowerCase().includes(query)),
        );
      }
      if (this.sortCol >= 0) {
        const col = this.sortCol;
        result = [...result].sort((a, b) => {
          const av = String(a[col] ?? "");
          const bv = String(b[col] ?? "");
          const cmp = av.localeCompare(bv, "zh-CN", { numeric: true });
          return this.sortAsc ? cmp : -cmp;
        });
      }
      return result;
    },
  },
  watch: {
    urls() {
      this.loadSheet();
    },
    sheetName(next) {
      if (!this.workbook || !next) return;
      if (this.sheetNames.includes(next)) {
        this.activeSheet = next;
        this.applySheet(next);
      }
    },
    rows() {
      if (this.loadingSheet) return;
      this.colWidths = [];
      this.$nextTick(() => this.updateLayout());
    },
    headers() {
      if (this.loadingSheet) return;
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
    async ensureXlsx() {
      if (!this.xlsxLib) {
        this.xlsxLib = await import("xlsx");
      }
      return this.xlsxLib;
    },

    formatCell(value) {
      if (value === null || value === undefined) return "";
      const text = String(value).trim();
      return text === "" ? "—" : text;
    },

    colStyle(width) {
      if (!width) return undefined;
      return { width: `${width}px` };
    },

    cellStyle(index) {
      const width = this.colWidths[index];
      if (!width) return undefined;
      return {
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        boxSizing: "border-box",
      };
    },

    computeColWidths() {
      const sampleSize = Math.min(this.rows.length, 100);
      const wrapWidth = 320;
      const maxSingleLine = 640;

      return this.headers.map((header, index) => {
        let maxWidth = this.estimateTextWidth(header);
        let maxChars = String(header ?? "").length;

        for (let rowIndex = 0; rowIndex < sampleSize; rowIndex += 1) {
          const cell = this.rows[rowIndex][index];
          const text = String(cell ?? "");
          maxWidth = Math.max(maxWidth, this.estimateTextWidth(cell));
          maxChars = Math.max(maxChars, text.length);
        }

        const fitted = Math.max(Math.ceil(maxWidth) + 28, 80);
        if (maxChars > 32 || fitted > 280) {
          return wrapWidth;
        }
        return Math.min(fitted, maxSingleLine);
      });
    },

    buildGridFromSheet(sheet) {
      const xlsx = this.xlsxLib;
      const positions = [];

      for (const key of Object.keys(sheet)) {
        if (key[0] === "!") continue;
        try {
          positions.push(xlsx.utils.decode_cell(key));
        } catch {
          // ignore invalid keys
        }
      }

      const jsonRows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });

      let rows = [];
      let colCount = 1;

      if (positions.length) {
        const startRow = Math.min(...positions.map((pos) => pos.r));
        const endRow = Math.max(...positions.map((pos) => pos.r));
        const startCol = Math.min(...positions.map((pos) => pos.c));
        const endCol = Math.max(...positions.map((pos) => pos.c));
        colCount = endCol - startCol + 1;

        for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
          const row = [];
          for (let colIndex = startCol; colIndex <= endCol; colIndex += 1) {
            const address = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
            const cell = sheet[address];
            row.push(cell == null ? "" : String(cell.w ?? cell.v ?? ""));
          }
          rows.push(row);
        }
      }

      const jsonColCount = jsonRows.reduce((max, row) => {
        if (!Array.isArray(row)) return max;
        let lastIndex = -1;
        row.forEach((cell, index) => {
          if (String(cell ?? "").trim() !== "") lastIndex = index;
        });
        return Math.max(max, lastIndex + 1, row.length);
      }, 0);

      colCount = Math.max(colCount, jsonColCount, 1);

      if (!rows.length && jsonRows.length) {
        rows = jsonRows.map((row) => {
          const cells = Array.isArray(row) ? row.map((cell) => cell ?? "") : [];
          while (cells.length < colCount) cells.push("");
          return cells.slice(0, colCount);
        });
      } else if (colCount > (rows[0]?.length ?? 0)) {
        rows = rows.map((row) => {
          const cells = [...row];
          while (cells.length < colCount) cells.push("");
          return cells.slice(0, colCount);
        });
      }

      return { rows, colCount };
    },

    isColumnLetterRow(row) {
      const cells = row
        .map((cell) => String(cell ?? "").trim())
        .filter((cell) => cell !== "");
      if (cells.length < 2) return false;
      return cells.every((cell) => /^[A-Z]{1,3}$/.test(cell));
    },

    findHeaderRowIndex(jsonData, padRow) {
      let bestIndex = 0;
      let bestFilled = 0;

      for (let index = 0; index < Math.min(jsonData.length, 20); index += 1) {
        const row = padRow(jsonData[index]);
        if (this.isColumnLetterRow(row)) continue;

        const filled = row.filter((cell) => String(cell ?? "").trim() !== "").length;
        if (filled > bestFilled) {
          bestFilled = filled;
          bestIndex = index;
        }
      }

      if (bestFilled >= 2) return bestIndex;

      for (let index = 0; index < Math.min(jsonData.length, 20); index += 1) {
        const row = padRow(jsonData[index]);
        const filled = row.filter((cell) => String(cell ?? "").trim() !== "").length;
        if (filled >= 2) return index;
      }

      return 0;
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

    estimateTextWidth(text) {
      const sample = String(text ?? "");
      let width = 0;
      for (const char of sample) {
        width += /[\u4e00-\u9fff]/.test(char) ? 14 : 8;
      }
      return width;
    },

    syncFrameHeight() {
      const frame = this.$el?.querySelector(".table-utils__frame");
      const headTable = this.$refs.headTableRef;
      const bodyTable = this.$refs.bodyTableRef;
      const hScroll = this.$refs.hScrollRef;
      if (!frame || !headTable || !bodyTable) return;

      const maxHeight = Math.min(480, window.innerHeight * 0.7);
      const hScrollHeight = this.hasHorizontalScroll ? hScroll?.offsetHeight || 12 : 0;
      const naturalHeight = headTable.offsetHeight + bodyTable.offsetHeight + hScrollHeight + 2;
      frame.style.height = `${Math.min(Math.max(naturalHeight, 120), maxHeight)}px`;
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
        if (this.headers.length) {
          this.colWidths = this.computeColWidths();
        }
        this.syncScrollMetrics();
        this.$nextTick(() => {
          this.syncFrameHeight();
        });
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

    isWorkbookBuffer(buffer) {
      if (!buffer || buffer.byteLength < 4) return false;
      const header = new Uint8Array(buffer.slice(0, 4));
      return header[0] === 0x50 && header[1] === 0x4b;
    },

    onSheetChange() {
      this.applySheet(this.activeSheet);
    },

    toggleSort(index) {
      if (this.sortCol === index) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortCol = index;
        this.sortAsc = true;
      }
    },

    isLink(value) {
      const text = String(value ?? "").trim();
      return /^https?:\/\//i.test(text);
    },

    cellHref(value) {
      return String(value ?? "").trim();
    },

    exportCsv() {
      if (!this.headers.length) return;
      const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const lines = [this.headers.map(escape).join(",")];
      for (const row of this.displayRows) {
        lines.push(row.map(escape).join(","));
      }
      const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const baseName = this.urls.split("/").pop()?.replace(/\.[^.]+$/, "") || "table";
      anchor.href = url;
      anchor.download = `${baseName}-${this.activeSheet || "sheet"}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    },

    applySheet(sheetName) {
      if (!this.workbook || !sheetName) return;

      const sheet = this.workbook.Sheets[sheetName];
      if (!sheet) {
        this.error = `未找到工作表「${sheetName}」，可用：${this.sheetNames.join("、") || "无"}`;
        this.rows = [];
        this.headers = [];
        return;
      }

      this.error = "";
      this.searchText = "";
      this.sortCol = -1;
      this.sortAsc = true;
      const { rows: gridRows, colCount } = this.buildGridFromSheet(sheet);

      if (!gridRows.length) {
        this.headers = [];
        this.rows = [];
        this.colWidths = [];
        return;
      }

      const padRow = (row) => {
        const cells = Array.isArray(row) ? row.map((cell) => cell ?? "") : [];
        while (cells.length < colCount) cells.push("");
        return cells.slice(0, colCount);
      };

      const headerRowIndex = this.findHeaderRowIndex(gridRows, padRow);
      const headerRow = padRow(gridRows[headerRowIndex]);
      const bodyRows = gridRows.slice(headerRowIndex + 1);

      this.loadingSheet = true;
      this.headers = headerRow.map((cell, index) => {
        const text = this.formatCell(cell);
        return text === "—" ? `列 ${index + 1}` : text;
      });
      this.rows = bodyRows
        .filter((row) => padRow(row).some((cell) => String(cell ?? "").trim() !== ""))
        .map((row) => padRow(row).map((cell) => this.formatCell(cell)));
      this.colWidths = this.computeColWidths();
      this.loadingSheet = false;
      this.scrollX = 0;

      this.$nextTick(() => this.updateLayout());
    },

    async loadSheet() {
      this.loading = true;
      this.error = "";
      this.headers = [];
      this.rows = [];
      this.colWidths = [];
      this.scrollX = 0;
      this.workbook = null;
      this.sheetNames = [];
      this.activeSheet = "";

      try {
        const response = await axios.get(this.excelUrl, {
          responseType: "arraybuffer",
          validateStatus: () => true,
        });

        if (response.status === 404) {
          this.error = `表格文件未找到：${this.urls}（路径 ${this.excelUrl}）`;
          return;
        }

        if (response.status === 422) {
          this.error = `表格文件为空（0 字节）：${this.urls}，请用 Excel 重新保存后再试`;
          return;
        }

        if (response.status >= 400) {
          this.error = `表格加载失败：${this.urls}（HTTP ${response.status}）`;
          return;
        }

        const buffer = response.data;
        if (!buffer || buffer.byteLength === 0) {
          this.error = `表格文件为空（0 字节）：${this.urls}，请用 Excel 重新保存后再试`;
          return;
        }

        if (!this.isWorkbookBuffer(buffer)) {
          const head = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 32)));
          if (/^\s*</.test(head)) {
            this.error = `表格资源请求异常（返回了 HTML 而非 xlsx）：${this.urls}`;
          } else {
            this.error = `表格文件损坏或格式无效：${this.urls}`;
          }
          return;
        }

        const xlsx = await this.ensureXlsx();
        const workbook = xlsx.read(buffer, { type: "array" });
        this.workbook = workbook;
        this.sheetNames = workbook.SheetNames;

        if (!this.sheetNames.length) {
          this.error = `工作簿中没有可用工作表：${this.urls}`;
          return;
        }

        const preferred = this.sheetNames.includes(this.sheetName)
          ? this.sheetName
          : this.sheetNames[0];
        this.activeSheet = preferred;
        this.applySheet(preferred);
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

.table-utils__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.table-utils__search {
  flex: 1 1 180px;
  min-width: 140px;
  max-width: 280px;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.table-utils__btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
}

.table-utils__btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.table-utils__th-sortable {
  cursor: pointer;
  user-select: none;
}

.table-utils__th-sortable:hover {
  background: color-mix(in srgb, var(--vp-c-brand-soft) 40%, var(--vp-c-bg));
}

.table-utils__sort-icon {
  margin-left: 0.25rem;
  color: var(--vp-c-brand-1);
  font-size: 12px;
}

.table-utils__link {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  word-break: break-all;
}

.table-utils__frame--sticky .table-utils__cell-sticky {
  position: sticky;
  left: 0;
  z-index: 3;
  background: var(--vp-c-bg);
  box-shadow: 1px 0 0 var(--vp-c-divider);
}

.table-utils__frame--sticky .table-utils__table--head .table-utils__cell-sticky {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 55%, #fff 45%);
  z-index: 4;
}

@media (max-width: 768px) {
  .table-utils__frame--sticky .table-utils__cell-sticky {
    position: sticky;
    left: 0;
  }
}

.table-utils__sheet-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.table-utils__sheet-select {
  min-width: 160px;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.table-utils__sheet-select:focus {
  outline: 2px solid color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
  border-color: var(--vp-c-brand-1);
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
  height: auto;
  max-height: min(480px, 70vh);
  min-height: 120px;
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
}

.table-utils__clip-inner {
  width: 100%;
  max-width: 100%;
  overflow: clip;
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
  table-layout: fixed;
  width: max-content;
}

.table-utils__table--head thead th,
.table-utils__table--body tbody td {
  box-sizing: border-box;
  padding: 8px 14px;
  text-align: left;
  vertical-align: top;
}

.table-utils__table--head thead th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background-color: color-mix(in srgb, var(--vp-c-bg-soft) 55%, #fff 45%);
}

.table-utils__table--body tbody td {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: visible;
  line-height: 1.45;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
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
.vp-doc .table-utils .table-utils__table {
  display: table !important;
  overflow: visible !important;
  margin: 0 !important;
}

.vp-doc .table-utils .table-utils__table thead {
  display: table-header-group !important;
}

.vp-doc .table-utils .table-utils__table tbody {
  display: table-row-group !important;
}

.vp-doc .table-utils .table-utils__table tr {
  display: table-row !important;
}

.vp-doc .table-utils .table-utils__table th,
.vp-doc .table-utils .table-utils__table td {
  display: table-cell !important;
}

.vp-doc .table-utils .table-utils__table colgroup {
  display: table-column-group !important;
}

.vp-doc .table-utils .table-utils__table col {
  display: table-column !important;
}

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
