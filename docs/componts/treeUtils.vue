<!-- 导入并读取Excel 表格数据 -->
<template>
    <div>
      
    </div>
  </template>
  
  <script>
  import * as XLSX from 'xlsx';
  
  export default {
    data() {
      return {
        tableData: [],
        limitUpload: 1
  
      };
    },
    methods: {
      
    },
    components: {
  
    },
  };
  </script>
  
  <style>
  .table-container {
    overflow-x: auto;
    white-space: nowrap;
    width: 100%;
    /* 根据需要设置宽 */
    height: 400px;
  }
  
  table {
    display: inline-block;
    white-space: nowrap;
  }
  </style>