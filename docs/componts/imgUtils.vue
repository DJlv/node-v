<template>
  <el-image style="width: 80px; height: 30px" :src="url" :preview-src-list="srcList"></el-image>
</template>
<script>
export default {
  props: ["urls"],
  data() {
    return {
      url: 'http://localhost:5173/node-v/public/ueWord/'+ this.urls,
      srcList: [
        'http://localhost:5173/node-v/public/ueWord/'+ this.urls
      ]
    }
  }
}
</script>
<script setup>
</script>