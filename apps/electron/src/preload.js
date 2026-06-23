const { contextBridge, ipcRenderer } = require('electron')

// Expose safe Electron APIs to the renderer process
contextBridge.exposeInMainWorld('churchosElectron', {
  openOutput: (sessionId, displayIndex) =>
    ipcRenderer.invoke('open-output', { sessionId, displayIndex }),
  closeOutput: (sessionId) =>
    ipcRenderer.invoke('close-output', { sessionId }),
  getDisplays: () =>
    ipcRenderer.invoke('get-displays'),
  isElectron: true,
})
