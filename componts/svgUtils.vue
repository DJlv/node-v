<template>
    <div class="app-container">
      <div id="app-container" ref="appContainer">
        <slot></slot>
      </div>
    </div>
</template>
 
<script>
export default {
  props: {
    svgName: {
      type: String,
      required: true
    }
  },
  data() {
    return {

    };
  },
  mounted() {
    let active = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let initialW;
    let initialH;

    let dragItem = this.$refs.appContainer;
    dragItem.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);

    function dragStart(e) {
      initialX = getComputedStyle(dragItem, null).getPropertyValue("left");
      initialY = getComputedStyle(dragItem, null).getPropertyValue("top");
      initialX = parseInt(initialX.substring(0, initialX.length - 2));
      initialY = parseInt(initialY.substring(0, initialY.length - 2));

      initialW = dragItem.offsetWidth;
      initialH = dragItem.offsetHeight;

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      document.getElementById('app-container').style.zIndex = 1000;

      active = true;
    }
    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      document.getElementById('app-container').style.zIndex = 1;
      active = false;
    }
    function drag(e) {
      if (active) {
        e.preventDefault();
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        dragItem.style.left = initialX + 'px';
        dragItem.style.top = initialY + 'px';
      }
    }
  },methods: {
  }
};
</script>
 
<style>

.app-container {
  overflow: auto;
  white-space: nowrap;
  height: 600px;
  width: 100%;
  cursor: move;
  background-color: #b2b2b2;
}
/* 隐藏滚动条的样式 */
.app-container::-webkit-scrollbar {
  display: none;
}
#app-container {
  position: relative;
  width: 800px;
}
</style>