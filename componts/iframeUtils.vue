<template>
    <div class="app-container">
        <iframe :src="src" ></iframe>
    </div>
</template>
 
<script>
export default {
  props: ["urls"],
  data() {
    return {
        src: this.urls
    };
  }
};
</script>
 
<style>
    html,body,iframe{
        width: 100%;
        height: 600px;
        margin: 0;
        padding: 0;
    }
    iframe{
        border: none;
    }
</style>