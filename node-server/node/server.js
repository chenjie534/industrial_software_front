// 后端 server.js
const { spawn } = require("child_process")
const { windowManager } = require("node-window-manager")
const { execSync } = require("child_process")
const express = require("express")
const app = express()
const port = 3334
const cors = require("cors")

app.use(cors())
app.use(express.json())

let isExeRunning = false
let childProcess = null
let targetWindowId = null

// 启动指定类型的exe程序
const startExe = async (exeType) => {
  let exePath = ""
  switch (exeType) {
    case "structure":
      exePath = "D:\\exe\\GETexe\\dist\\main.exe" // 结构程序的路径
      break
    case "impact":
      exePath = "D:\\exe\\GETexe2\\dist\\main.exe" // 冲击程序的路径
      break
    case "multibody":
      exePath = "D:\\exe\\GETexe3\\dist\\main.exe" // 多体程序的路径
      break
    default:
      throw new Error("无效的程序类型")
  }

  console.log(`尝试启动程序: ${exePath}`)

  // 确保程序能够被找到并启动
  if (!require("fs").existsSync(exePath)) {
    throw new Error(`程序文件不存在: ${exePath}`)
  }

  childProcess = spawn(exePath, {
    detached: true,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"] // 捕获输出以便调试
  })

  // 记录程序输出，帮助调试
  childProcess.stdout.on("data", (data) => {
    console.log(`程序输出: ${data}`)
  })

  childProcess.stderr.on("data", (data) => {
    console.error(`程序错误: ${data}`)
  })

  childProcess.on("error", (err) => {
    console.error("启动程序错误:", err)
    isExeRunning = false
  })

  childProcess.on("exit", (code) => {
    console.log(`程序退出，退出码: ${code}`)
    isExeRunning = false
    targetWindowId = null
  })

  console.log(`程序已启动，PID: ${childProcess.pid}`)
  isExeRunning = true

  // 给程序更多时间启动
  await new Promise((r) => setTimeout(r, 2000))
}

// 定位窗口函数 - 使用多种方法确保成功
const positionWindow = async (x, y, width, height) => {
  console.log(`传入的定位参数：x=${x}, y=${y}, width=${width}, height=${height}`)
  try {
    // 为确保尺寸合理，设置最小值
    width = Math.max(width, 100)
    height = Math.max(height, 100)
    let targetWindow

    // 使用缓存的窗口ID
    if (targetWindowId) {
      try {
        const allWindows = windowManager.getWindows()
        targetWindow = allWindows.find((w) => w.id === targetWindowId)

        if (!targetWindow || !targetWindow.isWindow() || !targetWindow.isVisible()) {
          console.log("缓存的窗口不再有效，重新查找")
          targetWindow = null
          targetWindowId = null
        }
      } catch (e) {
        console.log(`缓存的窗口不再有效 (${e.message})，重新查找`)
        targetWindow = null
        targetWindowId = null
      }
    }

    // 如果没有缓存或缓存无效，重新查找窗口
    if (!targetWindow) {
      console.log("开始查找目标窗口...")
      targetWindow = await findWindow()
      if (targetWindow) {
        targetWindowId = targetWindow.id // 更新缓存
        console.log(`找到新窗口ID: ${targetWindowId}`)
      }
    }

    if (!targetWindow) {
      throw new Error("未找到目标窗口")
    }

    console.log(
      `准备定位窗口 ID: ${targetWindow.id}, PID: ${targetWindow.processId}, 标题: "${targetWindow.getTitle()}"`
    )
    console.log(`设置窗口位置: x=${x}, y=${y}, width=${width}, height=${height}`)

    // 尝试多种方法定位窗口
    let positioned = false

    // 使用常规方法定位窗口
    try {
      targetWindow.bringToTop()
      await new Promise((r) => setTimeout(r, 100)) // 短暂延迟
      targetWindow.setBounds({ x, y, width, height })
      positioned = true
      console.log("使用标准方法成功定位窗口")
    } catch (err) {
      console.error("标准方法定位窗口失败:", err)
    }

    return positioned
  } catch (error) {
    console.error("定位失败:", error)
    return false
  }
}

// 改进 findWindow 函数，增加更广泛的匹配和重试机制
const findWindow = async (maxRetries = 5, delayMs = 500) => {
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      const windows = windowManager.getWindows()

      console.log(`第${retry + 1}次尝试查找窗口，当前有${windows.length}个窗口...`)

      // 列出所有窗口的标题和PID，帮助调试
      if (retry === 0 || retry % 5 === 0) {
        windows.forEach((w, idx) => {
          if (w.isWindow() && w.isVisible()) {
            try {
              console.log(`窗口 ${idx}: PID=${w.processId}, 标题="${w.getTitle() || "无标题"}"`)
            } catch (e) {
              console.log(`窗口 ${idx}: 无法获取详情 - ${e.message}`)
            }
          }
        })
      }

      // 尝试多种可能的方式识别窗口
      const targetWindow = windows.find((w) => {
        try {
          if (!w.isWindow() || !w.isVisible()) return false

          const title = w.getTitle() || ""
          const isTargetWindow =
            title.includes("图片展示程序") ||
            title.includes("main") ||
            title.includes("GETexe") ||
            title.toLowerCase().includes("image") ||
            (childProcess && w.processId === childProcess.pid)

          if (isTargetWindow) {
            console.log(`找到可能的目标窗口: PID=${w.processId}, 标题="${title}"`)
          }

          return isTargetWindow
        } catch (err) {
          console.error(`检查窗口时出错:`, err)
          return false
        }
      })

      if (targetWindow) {
        console.log(`成功找到目标窗口: PID=${targetWindow.processId}, 标题="${targetWindow.getTitle()}"`)
        return targetWindow
      }

      // 如果有子进程PID但没找到窗口，尝试特殊查找
      if (childProcess && childProcess.pid) {
        const processWindow = windows.find((w) => {
          try {
            return w.processId === childProcess.pid
          } catch (e) {
            return false
          }
        })

        if (processWindow) {
          console.log(`通过PID=${childProcess.pid}找到目标窗口`)
          return processWindow
        }
      }

      await new Promise((r) => setTimeout(r, delayMs))
    } catch (err) {
      console.error(`查找窗口时发生错误:`, err)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  throw new Error("无法找到目标窗口，请检查程序是否正常启动")
}

// 启动接口，根据请求的exe类型启动对应程序
app.get("/start-structure-exe", async (req, res) => {
  try {
    await startExe("structure")
    res.send("结构程序已启动")
  } catch (error) {
    res.status(500).send(`启动失败: ${error.message}`)
  }
})

app.get("/start-impact-exe", async (req, res) => {
  try {
    await startExe("impact")
    res.send("冲击程序已启动")
  } catch (error) {
    res.status(500).send(`启动失败: ${error.message}`)
  }
})

app.get("/start-multibody-exe", async (req, res) => {
  try {
    await startExe("multibody")
    res.send("多体程序已启动")
  } catch (error) {
    res.status(500).send(`启动失败: ${error.message}`)
  }
})

// 定位接口
app.post("/position-window", async (req, res) => {
  if (!isExeRunning) {
    console.log("程序未运行，拒绝定位请求")
    return res.status(400).send("程序未运行")
  }

  try {
    const { x, y, width, height } = req.body
    console.log("收到的定位数据：", req.body)
    // 检查参数是否合法
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number" ||
      width <= 0 ||
      height <= 0
    ) {
      console.error(`收到无效的窗口参数: x=${x}, y=${y}, width=${width}, height=${height}`)
      return res.status(400).send("无效的窗口参数")
    }

    console.log(`尝试定位窗口: x=${x}, y=${y}, width=${width}, height=${height}`)

    const success = await positionWindow(x, y, width, height)

    if (success) {
      console.log("窗口定位成功")
      res.send("窗口定位成功")
    } else {
      console.error("窗口定位失败，但请求已处理")
      res.status(500).send("窗口定位失败，但请求已处理")
    }
  } catch (error) {
    console.error("定位失败:", error)
    res.status(500).send(`定位失败: ${error.message}`)
  }
})

app.get("/check-exe-status", (req, res) => {
  res.send({ isRunning: isExeRunning })
})

app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`)
})
