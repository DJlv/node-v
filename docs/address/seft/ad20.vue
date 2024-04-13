<template>
  <div>
    <table border="1">
      <tr>
        <td>功能</td>
        <td>快捷键</td>
      </tr>
      <tr v-for="(value,index) in tableData">
        <td>{{ value.project }}</td>
        <td>{{ value.name }}</td>
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
        project: '器件摆放--按矩形排列',
        name: 'T-O-L'
      }, {
        project: '功能',
        name: '快捷键'
      }, {
        project: '功能',
        name: '快捷键'
      }]
    }
  }
}
</script>
