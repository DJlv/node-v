<!-- 导入并读取Excel 表格数据 -->
<template>
    <div class="table-container">
      <table width="100%">
        <tr v-for="item in tableData" :key="item.name">
          <td v-for="item_td in item">
            <span>
              {{ item_td }}
            </span>
          </td>
        </tr>
      </table>
    </div>
</template>

<script>
import axios from "axios";
import * as xlsx from "xlsx";

export default {
  props: ["urls","sheetName"],
  data() {
    return {
      excelUrl: 'http://localhost:5173/node-v/public/'+ this.urls,
      tableData: [],
      i: 0
    };
  },
  mounted() {
    this.getData();
  },
  methods: {
    getData() {
      // 使用Axios获取Excel文件
      axios.get(this.excelUrl, { responseType: 'arraybuffer' })
          .then(response => {
            // 将响应的二进制数据转换为Excel的workbook对象
            const workbook = xlsx.read(response.data, { type: 'buffer' });
            // 获取第一个sheet
            const sheetName = workbook.SheetNames[this.i];
            const sheet = workbook.Sheets[sheetName];
            // 将sheet转换为JSON对象数组
            const jsonData = xlsx.utils.sheet_to_json(sheet,{
              head: 0,
              defval: " "});
            console.log(jsonData);
            var data = []
            var firstObject = jsonData[0];
            var firstObjects = Object.keys(firstObject);
            this.tableData.push(firstObjects);
            jsonData.forEach(row => {
              var obj = Object.values(row);
              this.tableData.push(obj);
            })
            // 打印JSON数据
            console.log(data);
            return data;
          })
          .catch(error => {
            console.error('Error fetching Excel file:', error);
          });
    }
  }
};
</script>

<style>
.table-container {
  overflow-x: auto;
  white-space: nowrap;
  height: 400px;
  display: flex;
}
/*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸*/
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: #f5f5f5;
}

/*定义滚动条轨道 内阴影+圆角*/
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgb(186, 183, 183);
  border-radius: 10px;
  background-color: #f5f5f5;
}

/*定义滑块 内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgb(186, 183, 183);
  background-color: rgb(190, 190, 190);
}




table {
  display: inline-block;
  white-space: nowrap;
}

table  tr:nth-child(1)
{
  background-color: #9a9696;
  position: sticky;
  top: 0;
}

th, td {
  border: 1px solid black;
  padding: 8px;
  text-align: center;
}

</style>