const { spawn } = require("child_process")

// 启动 solver.js
const solverProcess = spawn("node", ["solver.js"])
solverProcess.stdout.on("data", (data) => {
  console.log(`solver.js 输出: ${data}`)
})
solverProcess.stderr.on("data", (data) => {
  console.error(`solver.js 错误: ${data}`)
})
solverProcess.on("close", (code) => {
  console.log(`solver.js 进程已退出，退出码: ${code}`)
})

// 启动 post.js
const postProcess = spawn("node", ["post.js"])
postProcess.stdout.on("data", (data) => {
  console.log(`post.js 输出: ${data}`)
})
postProcess.stderr.on("data", (data) => {
  console.error(`post.js 错误: ${data}`)
})
postProcess.on("close", (code) => {
  console.log(`post.js 进程已退出，退出码: ${code}`)
})

// 启动 server.js
const serverProcess = spawn("node", ["server.js"])
serverProcess.stdout.on("data", (data) => {
  console.log(`server.js 输出: ${data}`)
})
serverProcess.stderr.on("data", (data) => {
  console.error(`server.js 错误: ${data}`)
})
serverProcess.on("close", (code) => {
  console.log(`server.js 进程已退出，退出码: ${code}`)
})
