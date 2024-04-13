<template>
  <div class="home">
    <table border="1">
      <tr>
        <td>project</td>
        <td>name</td>
        <td>addr</td>
        <td>explain</td>
      </tr>
      <tr v-for="(value,index) in tableData">
        <td>{{ value.project }}</td>
        <td>{{ value.name }}</td>
        <td>{{ value.addr }}</td>
        <td>{{ value.explain }}</td>
      </tr>
    </table>
  </div>
</template>

<script>

export default {
  name: 'HomeView',
  data() {
    return {
      tableData:[{
        project: 'dummy',
        name: '42驱动板',
        address: '上海市普陀区金沙江路 1518 弄',
        addr: "https://springdoc.cn/docs/",
        explain: "http://localhost:5173/articles/%E7%BB%84%E4%BB%B6%E5%BA%93%E6%BA%90%E7%A0%81%E5%AE%9E%E7%8E%B0.html"
      }, {
        project: 'dummy',
        name: '35驱动板',
        address: '上海市普陀区金沙江路 1517 弄',
        addr: "https://springdoc.cn/docs/",
        explain: "http://localhost:5173/articles/%E7%BB%84%E4%BB%B6%E5%BA%93%E6%BA%90%E7%A0%81%E5%AE%9E%E7%8E%B0.html"
      }, {
        project: 'dummy',
        name: 'ref主板',
        address: '上海市普陀区金沙江路 1519 弄',
        addr: "https://springdoc.cn/docs/",
        explain: "http://localhost:5173/articles/%E7%BB%84%E4%BB%B6%E5%BA%93%E6%BA%90%E7%A0%81%E5%AE%9E%E7%8E%B0.html"
      }]
    }
  }
}
</script>
