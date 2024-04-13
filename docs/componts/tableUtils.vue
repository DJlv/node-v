<!-- 导入并读取Excel 表格数据 -->
<template>
    <div class="table-container">
      <table>
        <tr v-for="item in tableData" :key="item.name">
          <td v-for="item_td in item">
            <span class="span-table">
              {{ item_td }}
            </span>
          </td>
        </tr>
      </table>
    </div>
</template>

<script>
import * as XLSX from 'xlsx';

export default {
  props: ["tableData_props"],
  data() {
    return {
      tableData: this.tableData_props
    };
  }
};
</script>

<style>
.table-container {
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
  /* 根据需要设置宽度 */
  height: 400px;
}

table {
  display: inline-block;
  white-space: nowrap;
}
</style>