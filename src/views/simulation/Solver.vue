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

const startExe = async (exeType) => {
  try {
    // 清除之前的错误
    errorMessage.value = ""
    statusMessage.value = "正在启动程序..."

    // 根据不同的按钮类型启动不同的.exe
    const startResponse = await axios.get(`http://localhost:3334/start-solver-${exeType}-exe`, {
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
    <!-- 按钮区域 -->
    <div class="button-group">
      <button @click="startExe('structure')" :disabled="isExeRunning">结构</button>
      <button @click="startExe('impact')" :disabled="isExeRunning">冲击</button>
      <button @click="startExe('multibody')" :disabled="isExeRunning">多体</button>
    </div>

    <div class="status-bar">
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
.button-group {
  margin-bottom: 10px;
}

button {
  padding: 8px 15px;
  margin-right: 10px;
  font-size: 14px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

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
