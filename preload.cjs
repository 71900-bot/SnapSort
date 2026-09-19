const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('snapSort', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),
  renameFiles: (files, options) => ipcRenderer.invoke('rename-files', files, options),
})