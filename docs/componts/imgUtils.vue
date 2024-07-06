<template>
  <el-image style="width: 100%;" :src="url" :preview-src-list="srcList"></el-image>
</template>
<script>
export default {
  props: ["urls"],
  data() {
    return {
      url: 'http://localhost:5173/node-v/public/'+ this.urls,
      srcList: [
        'http://localhost:5173/node-v/public/'+ this.urls
      ]
    }
  }
}
</script>
<script setup>
</script>
<style>

img {
    max-width: 100% !important;
    display: block;
    margin: 20px auto;
}
</style>