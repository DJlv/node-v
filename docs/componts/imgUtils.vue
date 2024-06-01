<template>
<div  class="demo-image__preview">
  <el-image
      style="width: 50px; height: 50px"
      :src="url"
      fit="fill"
      :preview-src-list="srcList">
  </el-image>
</div>
</template>
<script>
import axios from "axios";

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