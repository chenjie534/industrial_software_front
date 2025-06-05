const { contextBridge, ipcRenderer } = require('electron');
console.log('preload.js is loaded');
// 向渲染进程暴露主进程的部分 API
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  sendRunExe: () => {
    ipcRenderer.send('run-exe');
  },
});
