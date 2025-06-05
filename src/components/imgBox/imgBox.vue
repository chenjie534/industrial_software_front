<template>
  <div class="myDiv">
    <img
      class="dragImg"
      ref="img"
      name="removeimg"
      :src="configImgData.imgSrc"
      v-drag
      :style="scaleFun"
      @mousewheel="rollImg()"
    />
    <div class="btnbox">
      <i style="margin-bottom: 20px" class="iconfont icon-add operchange" @click="scaleImgFun('large')">+</i>
      <i class="iconfont icon-jianhao operchange" @click="scaleImgFun('small')">--</i>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue"
//接收父组件传值
interface Props {
  configImgData: Object
}
const props = withDefaults(defineProps<Props>(), {
  configImgData: () => {
    return {}
  }
})

//vue3计算属性
const scaleFun = computed(() => {
  return `transform:scale(${props.configImgData.scale})`
})
//调用父组件方法
const emit = defineEmits<{
  (event: "scaleImgFun", data: string): void
}>()
const scaleImgFun = (type) => {
  //点击放大//点击缩小
  emit("scaleImgFun", type)
}
//滚轮缩放
const rollImg = () => {
  if (event.wheelDelta > 0) {
    //放大
    emit("scaleImgFun", "large")
  } else {
    //缩小
    emit("scaleImgFun", "small")
  }
}

//自定义指令
const vDrag = {
  //必须以 vNameOfDirective 的形式来命名本地自定义指令，以使得它们可以直接在模板中使用。
  beforeMount: (el) => {
    // 在元素上做些操作
    const dragBox = el //获取当前元素
    dragBox.onmousedown = (e) => {
      e.preventDefault()
      //算出鼠标相对元素的位置
      const disX = e.clientX - dragBox.offsetLeft
      const disY = e.clientY - dragBox.offsetTop
      document.onmousemove = (e) => {
        //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
        e.preventDefault()
        const left = e.clientX - disX
        const top = e.clientY - disY
        //移动当前元素
        dragBox.style.left = left + "px"
        dragBox.style.top = top + "px"
      }
      document.onmouseup = (e) => {
        e.preventDefault()
        //鼠标弹起来的时候不再移动
        document.onmousemove = null
        //预防鼠标弹起来后还会循环（即预防鼠标放上去的时候还会移动）
        document.onmouseup = null
      }
    }
  }
}
</script>

<style lang="less">
.myDiv {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  .dragImg {
    width: 100%;
    height: 100%;
    position: absolute;
    margin: 0 auto;
    display: block;
  }
  .btnbox {
    position: absolute;
    left: 10px;
    top: calc((100% - 100px) / 2);
    z-index: 99;
  }
  .operchange {
    //按钮的大小
    font-size: 30px;
    display: block;
    color: #fa1010;
    cursor: pointer;
    border: 2px solid red;
    border-radius: 40px;
  }
}
</style>
