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

    <div v-else class="table-utils__scroll">
      <table class="table-utils__table">
        <thead>
          <tr>
            <th v-for="(col, index) in headers" :key="`h-${index}`">
              {{ formatCell(col) }}
            </th>
          </tr>
        </thead>
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
    };
  },
  computed: {
    excelUrl() {
      const base = import.meta.env.BASE_URL || "/";
      const file = this.urls.replace(/^\//, "");
      return `${base}${file}`;
    },
  },
  mounted() {
    this.loadSheet();
  },
  methods: {
    formatCell(value) {
      if (value === null || value === undefined) return "";
      const text = String(value).trim();
      return text === "" ? "—" : text;
    },

    async loadSheet() {
      this.loading = true;
      this.error = "";
      this.headers = [];
      this.rows = [];

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
      } catch (err) {
        this.error = `表格加载失败：${err?.message || "请检查文件路径与网络"}`;
      } finally {
        this.loading = false;
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

.table-utils__scroll {
  overflow: auto;
  max-height: min(480px, 70vh);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 6%, transparent);
}

.table-utils__scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-utils__scroll::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.table-utils__scroll::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.table-utils__scroll::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

.table-utils__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  white-space: nowrap;
}

.table-utils__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-align: left;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  box-shadow: 0 1px 0 var(--vp-c-divider);
}

.table-utils__table tbody td {
  padding: 8px 14px;
  color: var(--vp-c-text-1);
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.table-utils__table tbody tr:last-child td {
  border-bottom: none;
}

.table-utils__table tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent);
}

.table-utils__table tbody tr:hover {
  background: var(--vp-c-default-soft);
}

@media (max-width: 640px) {
  .table-utils__table thead th,
  .table-utils__table tbody td {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>
