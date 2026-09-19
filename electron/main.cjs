const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

const isDevelopment = !app.isPackaged

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#f5f1e8',
    title: 'SnapSort',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDevelopment) {
    window.loadURL('http://localhost:5173')
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tif', '.tiff'])

ipcMain.handle('choose-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('scan-folder', async (_event, folderPath) => {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) continue
    const filePath = path.join(folderPath, entry.name)
    const stats = await fs.stat(filePath)
    files.push({ path: filePath, name: entry.name, size: stats.size, modified: stats.mtimeMs, extension: path.extname(entry.name).slice(1).toLowerCase() })
  }
  return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
})

ipcMain.handle('rename-files', async (_event, files, options) => {
  const folderPath = path.dirname(files[0].path)
  const names = files.map((file, index) => `${options.prefix}_${String(options.start + index).padStart(options.digits, '0')}.${file.extension}`)
  const sourcePaths = new Set(files.map((file) => path.resolve(file.path)))
  const destinations = names.map((name) => path.join(folderPath, name))
  if (new Set(destinations).size !== destinations.length) throw new Error('The naming pattern creates duplicate names.')
  for (const destination of destinations) {
    if (!sourcePaths.has(path.resolve(destination))) {
      try {
        await fs.access(destination)
        throw new Error(`A file named ${path.basename(destination)} already exists.`)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
  }

  const temporaryPaths = files.map((file, index) => `${file.path}.snapsort-${Date.now()}-${index}.tmp`)
  try {
    await Promise.all(files.map((file, index) => fs.rename(file.path, temporaryPaths[index])))
    await Promise.all(temporaryPaths.map((temporaryPath, index) => fs.rename(temporaryPath, destinations[index])))
    return names
  } catch (error) {
    await Promise.all(temporaryPaths.map(async (temporaryPath, index) => {
      try { await fs.rename(temporaryPath, files[index].path) } catch { /* best effort rollback */ }
    }))
    throw error
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})