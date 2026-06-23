const { app, BrowserWindow, screen, ipcMain, Menu } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const DEV = !app.isPackaged
const WEB_URL = DEV ? 'http://localhost:3000' : `file://${path.join(__dirname, '../../web/.next/server/app')}`

let operatorWindow = null
let outputWindows = {}  // sessionId -> BrowserWindow

function createOperatorWindow() {
  operatorWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'ChurchOS',
    backgroundColor: '#0d0f14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  operatorWindow.loadURL(DEV ? 'http://localhost:3000/dashboard' : WEB_URL)

  if (DEV) operatorWindow.webContents.openDevTools({ mode: 'detach' })

  operatorWindow.on('closed', () => {
    operatorWindow = null
    // Close all output windows when operator closes
    Object.values(outputWindows).forEach(w => w.close())
    outputWindows = {}
  })
}

function createOutputWindow(sessionId, displayIndex = 1) {
  if (outputWindows[sessionId]) {
    outputWindows[sessionId].focus()
    return
  }

  const displays = screen.getAllDisplays()
  const targetDisplay = displays[displayIndex] ?? displays[0]
  const { x, y, width, height } = targetDisplay.bounds

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    title: 'ChurchOS Output',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // No menu bar on output window
  win.setMenu(null)

  const outputUrl = DEV
    ? `http://localhost:3000/output/${sessionId}`
    : `${WEB_URL}/output/${sessionId}`

  win.loadURL(outputUrl)

  // Prevent accidental close
  win.on('close', (e) => {
    // Could add confirmation here in production
  })

  win.on('closed', () => {
    delete outputWindows[sessionId]
  })

  outputWindows[sessionId] = win
}

// IPC: operator requests to open output window on specific display
ipcMain.handle('open-output', (event, { sessionId, displayIndex }) => {
  createOutputWindow(sessionId, displayIndex ?? 1)
})

// IPC: get available displays
ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map((d, i) => ({
    index: i,
    id: d.id,
    label: i === 0 ? 'Primary (Operator)' : `Display ${i + 1}`,
    bounds: d.bounds,
    isPrimary: i === 0,
  }))
})

// IPC: close output window
ipcMain.handle('close-output', (event, { sessionId }) => {
  if (outputWindows[sessionId]) {
    outputWindows[sessionId].close()
  }
})

app.whenReady().then(() => {
  createOperatorWindow()

  // Auto-updater (production only)
  if (!DEV) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createOperatorWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowed = [
      'http://localhost:3000',
      'https://your-domain.com',
    ]
    if (!allowed.some(a => url.startsWith(a))) {
      event.preventDefault()
    }
  })
})
