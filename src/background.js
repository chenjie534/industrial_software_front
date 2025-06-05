const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const ffi = require("ffi-napi")
const ref = require("ref-napi")

let mainWindow = null
let exeProcess = null
let embeddedHwnd = null

// 定义完整的Windows API接口
const user32 = new ffi.Library("user32", {
  FindWindowW: ["int", ["string", "string"]],
  SetParent: ["int", ["int", "int"]],
  MoveWindow: ["bool", ["int", "int", "int", "int", "int", "bool"]],
  ShowWindow: ["bool", ["int", "int"]],
  EnumWindows: ["bool", ["pointer", "int"]],
  GetWindowThreadProcessId: ["uint32", ["int", "pointer"]],
  GetWindowLongW: ["int", ["int", "int"]],
  SetWindowLongW: ["int", ["int", "int", "int"]],
  GetClassNameW: ["int", ["int", "pointer", "int"]],
  GetWindowTextW: ["int", ["int", "pointer", "int"]],
  IsWindowVisible: ["int", ["int"]],
  UpdateWindow: ["bool", ["int"]],
  GetDpiForWindow: ["int", ["int"]],
  SetWindowPos: ["bool", ["int", "int", "int", "int", "int", "int", "uint"]],
  BringWindowToTop: ["bool", ["int"]]
})

// 改进后的窗口查找函数
function findExeWindow(pid) {
  const candidateWindows = []

  const enumProc = ffi.Callback("bool", ["int", "int"], (hwnd) => {
    try {
      // 获取进程ID
      const pidBuffer = Buffer.alloc(4)
      user32.GetWindowThreadProcessId(hwnd, pidBuffer)
      const windowPid = pidBuffer.readUInt32LE()

      if (windowPid === pid) {
        // 获取窗口类名和标题
        const classNameBuffer = Buffer.alloc(256)
        user32.GetClassNameW(hwnd, classNameBuffer, 255)
        const className = classNameBuffer.toString("ucs2").replace(/\0/g, "")

        const titleBuffer = Buffer.alloc(256)
        user32.GetWindowTextW(hwnd, titleBuffer, 255)
        const title = titleBuffer.toString("ucs2").replace(/\0/g, "")

        const isVisible = user32.IsWindowVisible(hwnd)

        // 添加到候选窗口列表
        candidateWindows.push({
          hwnd,
          className,
          title,
          isVisible
        })
      }
    } catch (error) {
      console.error("窗口检查错误:", error)
    }
    return true
  })

  user32.EnumWindows(enumProc, 0)

  // 打印所有候选窗口
  console.log(`找到 ${candidateWindows.length} 个与进程 ${pid} 相关的窗口:`)
  candidateWindows.forEach((win, i) => {
    console.log(`[${i}] 句柄: ${win.hwnd}, 类名: ${win.className}, 标题: ${win.title}, 可见: ${win.isVisible}`)
  })

  // 优先选择可见的主窗口
  const mainWindow = candidateWindows.find(
    (w) => w.isVisible && w.className !== "Button" && w.className !== "Edit" && !w.className.includes("Static")
  )

  if (mainWindow) {
    console.log(`选择主窗口: 句柄=${mainWindow.hwnd}, 类名=${mainWindow.className}`)
    return mainWindow.hwnd
  } else if (candidateWindows.length > 0) {
    console.log(`未找到合适的主窗口，选择第一个窗口: 句柄=${candidateWindows[0].hwnd}`)
    return candidateWindows[0].hwnd
  }

  console.log("未找到任何相关窗口")
  return 0
}

// 改进后的窗口嵌入函数
async function embedExeWindow(pid) {
  try {
    // 智能等待窗口创建（更为灵活的重试策略）
    const hwnd = await new Promise((resolve, reject) => {
      let retryCount = 0
      const maxRetries = 50 // 增加重试次数
      const checkInterval = 300 // 缩短检查间隔

      const checkWindow = () => {
        console.log(`第 ${retryCount + 1} 次尝试查找窗口...`)
        const foundHwnd = findExeWindow(pid)
        if (foundHwnd) {
          console.log("成功找到目标窗口:", foundHwnd)
          resolve(foundHwnd)
        } else if (retryCount < maxRetries) {
          retryCount++
          setTimeout(checkWindow, checkInterval)
        } else {
          reject(new Error("窗口未找到，超过最大重试次数"))
        }
      }

      checkWindow()
    })

    // 获取Electron窗口句柄
    const electronHwnd = mainWindow.getNativeWindowHandle().readUInt32LE(0)
    console.log(`Electron窗口句柄: ${electronHwnd}`)

    // 窗口样式常量
    const GWL_STYLE = -16
    const WS_CHILD = 0x40000000
    const WS_VISIBLE = 0x10000000
    const WS_POPUP = 0x80000000
    const SWP_NOSIZE = 0x0001
    const SWP_NOMOVE = 0x0002
    const SWP_NOZORDER = 0x0004
    const SWP_NOACTIVATE = 0x0010
    const SWP_FRAMECHANGED = 0x0020

    // 修改窗口样式前先保存原始样式
    console.log(`修改窗口 ${hwnd} 样式...`)
    const originalStyle = user32.GetWindowLongW(hwnd, GWL_STYLE)
    console.log(`原始样式: 0x${originalStyle.toString(16)}`)

    // 修改窗口样式
    let style = originalStyle
    style = style & ~WS_POPUP // 移除弹出窗口样式
    style |= WS_CHILD | WS_VISIBLE
    user32.SetWindowLongW(hwnd, GWL_STYLE, style)

    console.log(`新样式: 0x${style.toString(16)}`)

    // 应用样式更改
    user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED)

    // 设置父窗口
    console.log(`设置窗口 ${hwnd} 的父窗口为 ${electronHwnd}`)
    const result = user32.SetParent(hwnd, electronHwnd)
    if (!result) {
      const error = new Error("设置父窗口失败")
      console.error(error)
      throw error
    }
    console.log(`SetParent结果: ${result}`)

    // 调整窗口位置和大小
    const bounds = mainWindow.getContentBounds()
    console.log(`调整窗口大小: ${bounds.width}x${bounds.height}`)
    const moveResult = user32.MoveWindow(hwnd, 0, 0, bounds.width, bounds.height, true)
    console.log(`MoveWindow结果: ${moveResult}`)

    // 窗口同步逻辑
    const syncWindow = () => {
      const newBounds = mainWindow.getContentBounds()
      user32.MoveWindow(hwnd, 0, 0, newBounds.width, newBounds.height, true)
    }
    mainWindow.on("resize", syncWindow)
    mainWindow.on("move", syncWindow)

    // 激活窗口
    console.log(`激活窗口 ${hwnd}...`)
    user32.BringWindowToTop(hwnd)
    user32.ShowWindow(hwnd, 9) // SW_RESTORE
    user32.UpdateWindow(hwnd)

    embeddedHwnd = hwnd
    mainWindow.webContents.send("embed-status", "嵌入成功")
    return true
  } catch (error) {
    console.error("嵌入错误:", error)
    mainWindow.webContents.send("embed-status", `嵌入失败: ${error.message}`)
    return false
  }
}

// 创建窗口（增加管理员权限检测）
async function createWindow() {
  if (process.platform === "win32") {
    try {
      const sudo = require("electron-sudo")
      const options = { name: "Window Embedding" }
      await sudo.exec('echo "获取管理员权限"', options)
    } catch (error) {
      console.error("需要管理员权限:", error)
      app.quit()
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: "#FFF" // 确保背景不透明
  })

  mainWindow.loadURL("http://localhost:3333")

  ipcMain.on("run-exe", async () => {
    try {
      // 终止已有进程
      if (exeProcess) {
        exeProcess.kill()
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // 启动新进程
      const exePath = "D:\\GETexe\\dist\\main.exe"
      exeProcess = spawn(exePath, [], {
        detached: true,
        stdio: "ignore",
        windowsVerbatimArguments: true
      })

      // 进程退出处理
      exeProcess.on("exit", () => {
        if (embeddedHwnd) {
          user32.ShowWindow(embeddedHwnd, 0) // 隐藏窗口
          embeddedHwnd = null
        }
        mainWindow.webContents.send("exe-closed")
      })

      await embedExeWindow(exeProcess.pid)
    } catch (error) {
      console.error("执行错误:", error)
      mainWindow.webContents.send("embed-status", `错误: ${error.message}`)
    }
  })
}

// 应用生命周期
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (exeProcess) exeProcess.kill()
  if (embeddedHwnd) user32.ShowWindow(embeddedHwnd, 0)
  app.quit()
})
