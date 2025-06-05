<!-----------------1、利用外部协议调用.exe------------------------------------------->
<!--<script setup lang="ts">-->
<!--import { onMounted, ref } from 'vue';-->

<!--// 使用 ref 来引用链接元素-->
<!--const exeLink = ref<HTMLAnchorElement | null>(null);-->

<!--// onMounted(() => {-->
<!--//   // 模拟点击链接-->
<!--//   if (exeLink.value) {-->
<!--//     exeLink.value.click();-->
<!--//   }-->
<!--// });-->
<!--</script>-->

<!--<template>-->
<!--  <div class="pre-processing-content">-->
<!--    &lt;!&ndash; 使用 ref 绑定链接元素 &ndash;&gt;-->
<!--    <a ref="exeLink" href="f1://">前处理模块已加载，点击调用本地程序...</a>-->
<!--  </div>-->
<!--</template>-->

<!--<style scoped lang="scss">-->

<!--</style>-->

<!---------------2、利用electron实现嵌入------------------------------->
<!--<script setup>-->
<!--// import {electronAPI1} from "@/preload.js"-->
<!--const runExe = () => {-->
<!--  if (window.electronAPI) {-->
<!--    window.electronAPI.sendRunExe();-->
<!--  } else {-->
<!--    console.error('electronAPI 未定义，请确保 preload.js 已正确加载。');-->
<!--  }-->
<!--};-->
<!--</script>-->
<!--<template>-->
<!--  <div class="pre-processing-content">-->
<!--    <button @click="runExe">运行.exe 程序</button>-->
<!--    &lt;!&ndash; 用于模拟嵌入的容器 &ndash;&gt;-->
<!--    <div id="embed-container"></div>-->
<!--  </div>-->
<!--</template>-->

<!--<style scoped lang="scss">-->
<!--.pre-processing-content {-->
<!--  padding: 20px;-->
<!--}-->
<!--#embed-container {-->
<!--  width: 1200px;-->
<!--  height: 800px;-->
<!--}-->
<!--</style>-->

<!--<template>-->
<!--  <div>-->
<!--    <button @click="runExe" :disabled="isExeRunning">{{ buttonText }}</button>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { ref } from 'vue';-->

<!--const isExeRunning = ref(false);-->
<!--const buttonText = ref('启动.exe程序');-->

<!--const runExe = () => {-->
<!--  window.electronAPI.sendRunExe();-->
<!--  isExeRunning.value = true;-->
<!--  buttonText.value = '程序正在运行';-->
<!--};-->

<!--window.electronAPI.on('embed-status', (status) => {-->
<!--  console.log(status);-->
<!--});-->

<!--window.electronAPI.on('exe-closed', () => {-->
<!--  isExeRunning.value = false;-->
<!--  buttonText.value = '启动.exe程序';-->
<!--  console.log('接收到.exe关闭事件，已更新按钮状态');-->
<!--});-->
<!--</script>-->

<!-------------------借助 Node.js 构建一个中间层，成功调用，但是也不能嵌入到页面------------>
<!--<template>-->
<!--  <div>-->
<!--    <button @click="startExe" :disabled="isExeRunning">{{ buttonText }}</button>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import axios from 'axios';-->
<!--import { ref, onMounted, onUnmounted } from 'vue';-->

<!--const isExeRunning = ref(false);-->
<!--const buttonText = ref('启动 .exe 程序');-->
<!--let intervalId;-->

<!--const startExe = async () => {-->
<!--  try {-->
<!--    const response = await axios.get('http://localhost:3334/start-exe');-->
<!--    console.log(response.data);-->
<!--    isExeRunning.value = true;-->
<!--    buttonText.value = '程序正在运行';-->
<!--    startStatusPolling();-->
<!--  } catch (error) {-->
<!--    console.error('请求出错:', error);-->
<!--  }-->
<!--};-->

<!--const startStatusPolling = () => {-->
<!--  intervalId = setInterval(async () => {-->
<!--    try {-->
<!--      const response = await axios.get('http://localhost:3334/check-exe-status');-->
<!--      const { isRunning } = response.data;-->

<!--      // 当状态变化时更新UI-->
<!--      if (isExeRunning.value !== isRunning) {-->
<!--        isExeRunning.value = isRunning;-->
<!--        buttonText.value = isRunning ? '程序正在运行' : '启动 .exe 程序';-->
<!--      }-->

<!--      // 程序关闭时停止轮询-->
<!--      if (!isRunning) {-->
<!--        clearInterval(intervalId);-->
<!--      }-->
<!--    } catch (error) {-->
<!--      console.error('检查 .exe 程序状态时出错:', error);-->
<!--      // 错误时也停止轮询-->
<!--      clearInterval(intervalId);-->
<!--    }-->
<!--  }, 1000);-->
<!--};-->

<!--onMounted(() => {-->
<!--  // 初始化时检查程序状态-->
<!--  startStatusPolling();-->
<!--});-->

<!--onUnmounted(() => {-->
<!--  if (intervalId) {-->
<!--    clearInterval(intervalId);-->
<!--  }-->
<!--});-->
<!--</script>-->
<!------------------------------------------------------------------------------------------>

<!--------------------尝试嵌入-----利用VNC服务器----------------------------------------------------------------->
<!--<template>-->
<!--  <div>-->
<!--    <button @click="startExe">启动.exe程序</button>-->
<!--    &lt;!&ndash; 使用ref指令绑定vncContainer &ndash;&gt;-->
<!--    <div ref="vncContainer" id="vnc-container"></div>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import axios from 'axios';-->
<!--import { onMounted, ref, nextTick } from 'vue';-->
<!--// import { RFB } from 'novnc/core/rfb.js';-->
<!--const vncContainer = ref(null);-->
<!--let noVncLoaded = false; // 新增标志变量-->

<!--const startExe = async () => {-->
<!--  try {-->
<!--    const response = await axios.get('http://localhost:3334/start-exe');-->
<!--    console.log(response.data);-->
<!--    // 启动.exe程序后连接到VNC服务器-->
<!--    await nextTick(); // 等待DOM更新-->
<!--    console.log('nextTick后vncContainer的值:', vncContainer.value);-->
<!--    if (noVncLoaded) {-->
<!--      connectToVNC();-->
<!--    } else {-->
<!--      console.log('noVNC库尚未加载完成');-->
<!--    }-->
<!--  } catch (error) {-->
<!--    console.error('请求出错:', error);-->
<!--  }-->
<!--};-->

<!--const connectToVNC = () => {-->
<!--  console.log('1');-->
<!--  if (vncContainer.value) {-->
<!--    console.log('2');-->
<!--    const rfb = new window.RFB(vncContainer.value, 'ws://10.195.92.98:5900');-->

<!--    rfb.on('credentialsrequired', () => {-->
<!--      rfb.sendCredentials({ password: '123456' });-->
<!--    });-->

<!--    // 添加连接状态的监听-->
<!--    rfb.on('connect', () => {-->
<!--      console.log('成功连接到VNC服务器');-->
<!--    });-->

<!--    rfb.on('disconnect', () => {-->
<!--      console.log('与VNC服务器断开连接');-->
<!--    });-->

<!--    rfb.on('error', (error) => {-->
<!--      console.error('连接VNC服务器时出错:', error);-->
<!--    });-->
<!--  } else {-->
<!--    console.log('vncContainer.value为null');-->
<!--  }-->
<!--};-->

<!--onMounted(() => {-->
<!--  // 引入noVNC库-->
<!--  const script = document.createElement('script');-->
<!--  script.src = '/noVNC/core/rfb.js';-->
<!--  script.onload = () => {-->
<!--    // 库加载完成后可以连接到VNC服务器-->
<!--    console.log('noVNC库加载成功');-->
<!--    // if (window.RFB) {-->
<!--    //   noVncLoaded = true; // 设置标志变量-->
<!--    // } else {-->
<!--    //   console.error('window.RFB未正确挂载');-->
<!--    // }-->

<!--  };-->
<!--  script.onerror = () => {-->
<!--    console.error('noVNC库加载失败');-->
<!--  };-->
<!--  document.head.appendChild(script);-->
<!--});-->
<!--</script>-->

<!--<style scoped>-->
<!--#vnc-container {-->
<!--  width: 800px;-->
<!--  height: 600px;-->
<!--  margin-top: 20px;-->
<!--}-->
<!--</style>-->

<!--------------------------尝试伪嵌入，仅达到嵌入的效果就好----------------------------------------------------------------->
<!--<script setup>-->
<!--import axios from "axios"-->
<!--import { ref, onBeforeUnmount, onMounted } from "vue"-->

<!--const isExeRunning = ref(false)-->
<!--const container = ref(null)-->
<!--let positionInterval-->
<!--const errorMessage = ref("")-->
<!--const statusMessage = ref("准备就绪")-->

<!--// 修改坐标计算 - 不再使用devicePixelRatio-->
<!--const getContainerPosition = () => {-->
<!--  if (!container.value) return { x: 0, y: 0, width: 0, height: 0 }-->

<!--  const rect = container.value.getBoundingClientRect()-->

<!--  // 获取视口相对于屏幕左上角的偏移-->
<!--  const viewportX = window.screenLeft !== undefined ? window.screenLeft : window.screenX-->
<!--  const viewportY = window.screenTop !== undefined ? window.screenTop : window.screenY-->

<!--  return {-->
<!--    x: Math.round(viewportX + rect.left),-->
<!--    y: Math.round(viewportY + rect.top),-->
<!--    width: Math.round(rect.width),-->
<!--    height: Math.round(rect.height)-->
<!--  }-->
<!--}-->

<!--// 检查程序状态-->
<!--const checkExeStatus = async () => {-->
<!--  try {-->
<!--    statusMessage.value = "检查程序状态..."-->
<!--    const response = await axios.get("http://localhost:3334/check-exe-status")-->
<!--    isExeRunning.value = response.data.isRunning-->
<!--    statusMessage.value = isExeRunning.value ? "程序正在运行" : "准备就绪"-->
<!--  } catch (error) {-->
<!--    console.error("检查程序状态失败:", error)-->
<!--    statusMessage.value = "无法连接到服务器"-->
<!--    errorMessage.value = "无法连接到服务器，请确保服务器已启动"-->
<!--  }-->
<!--}-->

<!--const startExe = async () => {-->
<!--  try {-->
<!--    // 清除之前的错误-->
<!--    errorMessage.value = ""-->
<!--    statusMessage.value = "正在启动程序..."-->

<!--    // 启动程序-->
<!--    const startResponse = await axios.get("http://localhost:3334/start-exe", {-->
<!--      timeout: 30000 // 增加超时时间-->
<!--    })-->

<!--    console.log("启动响应:", startResponse.data)-->
<!--    statusMessage.value = "程序已启动，开始定位..."-->
<!--    isExeRunning.value = true-->

<!--    // 给程序一些时间初始化-->
<!--    await new Promise((r) => setTimeout(r, 2000))-->

<!--    // 立即定位-->
<!--    await updateWindowPosition()-->

<!--    // 设置定位间隔-->
<!--    if (positionInterval) clearInterval(positionInterval)-->
<!--    positionInterval = setInterval(updateWindowPosition, 1000)-->
<!--  } catch (error) {-->
<!--    console.error("启动程序失败:", error)-->
<!--    isExeRunning.value = false-->
<!--    statusMessage.value = "启动失败"-->
<!--    errorMessage.value = `启动失败: ${error.response?.data || error.message}`-->
<!--  }-->
<!--}-->

<!--// 抽取出单独的定位函数，方便调用-->
<!--const updateWindowPosition = async () => {-->
<!--  if (!isExeRunning.value || !container.value) return-->

<!--  try {-->
<!--    statusMessage.value = "正在定位窗口..."-->
<!--    const position = getContainerPosition()-->
<!--    console.log("计算的位置:", position)-->

<!--    // 检查位置值是否合理-->
<!--    if (position.width <= 0 || position.height <= 0) {-->
<!--      console.error("计算得到的窗口尺寸无效:", position)-->
<!--      statusMessage.value = "窗口尺寸计算错误"-->
<!--      return-->
<!--    }-->

<!--    // 添加重试逻辑-->
<!--    let retries = 3-->
<!--    let success = false-->

<!--    while (retries > 0 && !success) {-->
<!--      try {-->
<!--        const positionResponse = await axios.post("http://localhost:3334/position-window", position, { timeout: 5000 })-->

<!--        console.log("定位响应:", positionResponse.data)-->
<!--        success = true-->
<!--        statusMessage.value = "窗口定位成功"-->
<!--        break-->
<!--      } catch (retryError) {-->
<!--        console.error(`定位重试失败 (剩余${retries - 1}次):`, retryError)-->
<!--        retries&#45;&#45;-->
<!--        await new Promise((r) => setTimeout(r, 1000)) // 等待1秒后重试-->
<!--      }-->
<!--    }-->

<!--    if (!success) {-->
<!--      throw new Error("多次重试后定位仍然失败")-->
<!--    }-->
<!--  } catch (posError) {-->
<!--    console.error("定位失败:", posError)-->
<!--    statusMessage.value = "窗口定位失败，但程序可能已启动"-->
<!--    errorMessage.value = `定位失败: ${posError.response?.data || posError.message}`-->
<!--  }-->
<!--}-->

<!--// 监听container的大小变化-->
<!--const resizeObserver =-->
<!--  typeof ResizeObserver !== "undefined"-->
<!--    ? new ResizeObserver(() => {-->
<!--        if (isExeRunning.value) {-->
<!--          updateWindowPosition()-->
<!--        }-->
<!--      })-->
<!--    : null-->

<!--// 添加监听窗口大小变化和滚动事件-->
<!--onMounted(() => {-->
<!--  // 初始检查-->
<!--  checkExeStatus()-->

<!--  // 添加resize观察器-->
<!--  if (resizeObserver && container.value) {-->
<!--    resizeObserver.observe(container.value)-->
<!--  }-->

<!--  // 添加窗口焦点事件处理-->
<!--  window.addEventListener("focus", updateWindowPosition)-->

<!--  // 添加滚动事件监听-->
<!--  window.addEventListener("scroll", updateWindowPosition)-->

<!--  // 添加窗口大小变化事件监听-->
<!--  window.addEventListener("resize", updateWindowPosition)-->
<!--})-->

<!--// 清理事件监听-->
<!--onBeforeUnmount(() => {-->
<!--  if (positionInterval) {-->
<!--    clearInterval(positionInterval)-->
<!--  }-->

<!--  if (resizeObserver && container.value) {-->
<!--    resizeObserver.unobserve(container.value)-->
<!--  }-->

<!--  window.removeEventListener("focus", updateWindowPosition)-->
<!--  window.removeEventListener("scroll", updateWindowPosition)-->
<!--  window.removeEventListener("resize", updateWindowPosition)-->
<!--})-->
<!--</script>-->

<!--<template>-->
<!--  <div>-->
<!--    <div class="status-bar">-->
<!--      <button @click="startExe" :disabled="isExeRunning">-->
<!--        {{ isExeRunning ? "运行中" : "启动程序" }}-->
<!--      </button>-->
<!--      <span class="status">{{ statusMessage }}</span>-->
<!--      <button v-if="isExeRunning" @click="updateWindowPosition" class="refresh-btn">刷新位置</button>-->
<!--    </div>-->

<!--    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>-->

<!--    <div ref="container" class="exe-container" :class="{ active: isExeRunning }">-->
<!--      <div v-if="!isExeRunning" class="placeholder-message">点击"启动程序"按钮加载外部应用</div>-->
<!--      <div v-else class="loading-message">正在加载程序窗口...如果看不到程序界面，请点击"刷新位置"按钮</div>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<style scoped>-->
<!--.status-bar {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  margin-bottom: 10px;-->
<!--  padding: 8px;-->
<!--  background-color: #f5f5f5;-->
<!--  border-radius: 4px;-->
<!--}-->
<!--.status {-->
<!--  margin-left: 10px;-->
<!--  font-size: 14px;-->
<!--  color: #666;-->
<!--  flex-grow: 1;-->
<!--}-->
<!--.refresh-btn {-->
<!--  margin-left: 10px;-->
<!--  font-size: 12px;-->
<!--  padding: 4px 8px;-->
<!--}-->
<!--.exe-container {-->
<!--  width: 80%;-->
<!--  height: 60vh;-->
<!--  margin: 20px auto;-->
<!--  border: 1px dashed #ccc;-->
<!--  background-color: #f9f9f9;-->
<!--  position: relative;-->
<!--  transition: border-color 0.3s;-->
<!--}-->
<!--.exe-container.active {-->
<!--  border: 1px solid #4c8bf5;-->
<!--  background-color: transparent;-->
<!--}-->
<!--.error-message {-->
<!--  color: red;-->
<!--  margin: 10px 0;-->
<!--  padding: 8px;-->
<!--  background-color: #fff3f3;-->
<!--  border-radius: 4px;-->
<!--}-->
<!--.loading-message,-->
<!--.placeholder-message {-->
<!--  position: absolute;-->
<!--  top: 50%;-->
<!--  left: 50%;-->
<!--  transform: translate(-50%, -50%);-->
<!--  color: #999;-->
<!--  text-align: center;-->
<!--}-->
<!--</style>-->

<script setup>
import axios from "axios"
import { ref, onBeforeUnmount, onMounted } from "vue"

const isExeRunning = ref(false)
const container = ref(null)
let positionInterval
const errorMessage = ref("")
const statusMessage = ref("准备就绪")
let intervalId

// 修改坐标计算 - 不再使用devicePixelRatio
const getContainerPosition = () => {
  if (!container.value) return { x: 0, y: 0, width: 0, height: 0 }

  const rect = container.value.getBoundingClientRect()

  // 获取视口相对于屏幕左上角的偏移
  const viewportX = window.screenLeft !== undefined ? window.screenLeft : window.screenX
  const viewportY = window.screenTop !== undefined ? window.screenTop : window.screenY

  return {
    x: Math.round(viewportX + rect.left),
    y: Math.round(viewportY + rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  }
}

// 检查程序状态
const checkExeStatus = async () => {
  try {
    statusMessage.value = "检查程序状态..."
    const response = await axios.get("http://localhost:3334/check-exe-status")
    isExeRunning.value = response.data.isRunning
    statusMessage.value = isExeRunning.value ? "程序正在运行" : "准备就绪"
  } catch (error) {
    console.error("检查程序状态失败:", error)
    statusMessage.value = "无法连接到服务器"
    errorMessage.value = "无法连接到服务器，请确保服务器已启动"
  }
}
const startStatusPolling = () => {
  intervalId = setInterval(async () => {
    try {
      statusMessage.value = "检查程序状态..."
      const response = await axios.get("http://localhost:3334/check-exe-status")
      isExeRunning.value = response.data.isRunning
      statusMessage.value = isExeRunning.value ? "程序正在运行" : "准备就绪"
      if (!isExeRunning.value) {
        isExeRunning.value = false
        clearInterval(intervalId)
      }
    } catch (error) {
      console.error("检查 .exe 程序状态时出错:", error)
    }
  }, 1000)
}

const startExe = async () => {
  try {
    // 清除之前的错误
    errorMessage.value = ""
    statusMessage.value = "正在启动程序..."

    // 启动程序
    const startResponse = await axios.get("http://localhost:3334/start-exe", {
      timeout: 30000 // 增加超时时间
    })

    console.log("启动响应:", startResponse.data)
    statusMessage.value = "程序已启动，开始定位..."
    isExeRunning.value = true
    startStatusPolling()

    // 给程序一些时间初始化
    await new Promise((r) => setTimeout(r, 2000))

    // 立即定位
    await updateWindowPosition()

    // 设置定位间隔
    if (positionInterval) clearInterval(positionInterval)
    positionInterval = setInterval(updateWindowPosition, 1000)
  } catch (error) {
    console.error("启动程序失败:", error)
    isExeRunning.value = false
    statusMessage.value = "启动失败"
    errorMessage.value = `启动失败: ${error.response?.data || error.message}`
  }
}

// 抽取出单独的定位函数，方便调用
const updateWindowPosition = async () => {
  if (!isExeRunning.value || !container.value) return

  try {
    statusMessage.value = "正在定位窗口..."
    const position = getContainerPosition()
    console.log("计算的位置:", position)

    // 检查位置值是否合理
    if (position.width <= 0 || position.height <= 0) {
      console.error("计算得到的窗口尺寸无效:", position)
      statusMessage.value = "窗口尺寸计算错误"
      return
    }

    // 添加重试逻辑
    let retries = 3
    let success = false

    while (retries > 0 && !success) {
      try {
        const positionResponse = await axios.post("http://localhost:3334/position-window", position, { timeout: 5000 })

        console.log("定位响应:", positionResponse.data)
        success = true
        statusMessage.value = "窗口定位成功"
        break
      } catch (retryError) {
        console.error(`定位重试失败 (剩余${retries - 1}次):`, retryError)
        retries--
        await new Promise((r) => setTimeout(r, 1000)) // 等待1秒后重试
      }
    }

    // if (!success) {
    //   throw new Error("多次重试后定位仍然失败")
    // }
  } catch (posError) {
    console.error("定位失败:", posError)
    statusMessage.value = "窗口定位失败，但程序可能已启动"
    errorMessage.value = `定位失败: ${posError.response?.data || posError.message}`
  }
}

// 监听container的大小变化
const resizeObserver =
  typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => {
        if (isExeRunning.value) {
          updateWindowPosition()
        }
      })
    : null

// 添加监听窗口大小变化和滚动事件
onMounted(() => {
  // 初始检查
  checkExeStatus()
  // 初始化时检查程序状态
  startStatusPolling()

  // 添加resize观察器
  if (resizeObserver && container.value) {
    resizeObserver.observe(container.value)
  }

  // 添加窗口焦点事件处理
  window.addEventListener("focus", updateWindowPosition)

  // 添加滚动事件监听
  window.addEventListener("scroll", updateWindowPosition)

  // 添加窗口大小变化事件监听
  window.addEventListener("resize", updateWindowPosition)
})

// 清理事件监听
onBeforeUnmount(() => {
  if (positionInterval) {
    clearInterval(positionInterval)
  }

  if (resizeObserver && container.value) {
    resizeObserver.unobserve(container.value)
  }

  window.removeEventListener("focus", updateWindowPosition)
  window.removeEventListener("scroll", updateWindowPosition)
  window.removeEventListener("resize", updateWindowPosition)
})
</script>

<template>
  <div>
    <div class="status-bar">
      <button @click="startExe" :disabled="isExeRunning">
        {{ isExeRunning ? "运行中" : "启动程序" }}
      </button>
      <span class="status">{{ statusMessage }}</span>
      <button v-if="isExeRunning" @click="updateWindowPosition" class="refresh-btn">刷新位置</button>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <div ref="container" class="exe-container" :class="{ active: isExeRunning }">
      <div v-if="!isExeRunning" class="placeholder-message">点击"启动程序"按钮加载内嵌应用</div>
      <div v-else class="loading-message">正在加载程序窗口...如果看不到程序界面，请点击"刷新位置"按钮</div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
.status {
  margin-left: 10px;
  font-size: 14px;
  color: #666;
  flex-grow: 1;
}
.refresh-btn {
  margin-left: 10px;
  font-size: 12px;
  padding: 8px 15px;
}
.exe-container {
  width: 80%;
  height: 60vh;
  margin: 20px auto;
  border: 1px dashed #ccc;
  background-color: #f9f9f9;
  position: relative;
  transition: border-color 0.3s;
}
.exe-container.active {
  border: 1px solid #4c8bf5;
  background-color: transparent;
}
.error-message {
  color: red;
  margin: 10px 0;
  padding: 8px;
  background-color: #fff3f3;
  border-radius: 4px;
}
.loading-message,
.placeholder-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  text-align: center;
}
</style>
