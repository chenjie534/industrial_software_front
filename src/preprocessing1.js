// const { app, BrowserWindow } = require('electron');
// const path = require('path');
//
// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js') // 指定 preload 脚本
//     }
//   });
//
//   // 这里假设前端开发服务器启动后地址是 http://localhost:3333
//   win.loadURL('http://localhost:3333');
//
//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// }
//
// app.whenReady().then(() => {
//   createWindow();
// });
//
// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit();
// });
