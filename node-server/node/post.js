// 后端 server.js
const { spawn } = require("child_process")
const { windowManager } = require("node-window-manager")
const { execSync } = require("child_process")
const express = require("express")
const app = express()
const port = 3336
const cors = require("cors")

app.use(cors())
app.use(express.json())

let isExeRunning = false
let childProcess = null
let targetWindowId = null

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
      //targetWindow.setBounds({ x, y })
      positioned = true
      console.log("使用标准方法成功定位窗口")
    } catch (err) {
      console.error("标准方法定位窗口失败:", err)
    }

    /*     // 如果常规方法失败，使用 PowerShell 定位
    if (!positioned) {
      try {
        const psResult = await setWindowPosByPowerShell(targetWindow.id, x, y, width, height)
        if (psResult) {
          positioned = true
          console.log("使用PowerShell成功定位窗口")
        }
      } catch (err) {
        console.error("PowerShell定位失败:", err)
      }
    }

    // 最后尝试使用 WinAPI 的 SetWindowPos 定位
    if (!positioned) {
      try {
        const winApiResult = await setWindowPosUsingWinApi(targetWindow.id, x, y, width, height)
        if (winApiResult) {
          positioned = true
          console.log("使用WinAPI成功定位窗口")
        }
      } catch (err) {
        console.error("WinAPI定位失败:", err)
      }
    } */

    /* // 确保窗口处于前台
    try {
      const psActivateCmd = `
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        }
"@

        $hwnd = [IntPtr]::new(${targetWindow.id})
        [Win32]::ShowWindow($hwnd, 9) # SW_RESTORE = 9
        [Win32]::SetForegroundWindow($hwnd)
      `

      execSync(psActivateCmd, { shell: "powershell.exe" })
      console.log("已尝试将窗口设置为前台")
    } catch (err) {
      console.error("设置窗口为前台失败:", err)
    } */

    return positioned
  } catch (error) {
    console.error("定位失败:", error)
    return false
  }
}

// 添加一个基于WinAPI的定位方法
/* const setWindowPosUsingWinApi = async (hwnd, x, y, width, height) => {
  try {
    const psCmd = `
      Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;

      public class User32 {
          [DllImport("user32.dll", SetLastError = true)]
          public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);

          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

          [DllImport("user32.dll")]
          public static extern bool UpdateWindow(IntPtr hWnd);
      }
"@

      $hwnd = [IntPtr]::new(${hwnd})
      # 显示窗口 (SW_SHOW = 5)
      [User32]::ShowWindow($hwnd, 5)
      # 移动窗口
      $result = [User32]::MoveWindow($hwnd, ${x}, ${y}, ${width}, ${height}, $true)
      # 更新窗口
      [User32]::UpdateWindow($hwnd)

      if ($result) { "成功" } else { "失败" }
    `

    const result = execSync(psCmd, { shell: "powershell.exe" }).toString().trim()
    return result === "成功"
  } catch (error) {
    console.error("WinAPI定位方法执行失败:", error)
    return false
  }
} */

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

// 启动接口
app.get("/start-exe", async (req, res) => {
  if (isExeRunning) return res.status(400).send("程序已运行")

  try {
    // 如果存在旧的窗口ID，重置它
    targetWindowId = null

    // 使用绝对路径，确保路径正确
    const exePath = "D:\\exe\\GETexe5\\dist\\main.exe"
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

    res.send("启动成功")
  } catch (error) {
    console.error(`启动失败: ${error.message}`)
    isExeRunning = false
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

// 该接口用于接收前端发送的关闭提示信息
app.post("/exe-closed", (req, res) => {
  if (isExeRunning) {
    // 这里可以添加实际的关闭.exe程序的逻辑，目前只是简单设置为false
    isExeRunning = false
    if (childProcess) {
      try {
        childProcess.kill() // 尝试关闭子进程
      } catch (e) {
        console.error("关闭子进程失败:", e)
      }
    }
    targetWindowId = null
    res.status(200).send("已接收关闭提示并处理")
  } else {
    res.status(400).send(".exe 程序未在运行")
  }
})

app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`)
})
