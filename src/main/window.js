import { BrowserWindow } from 'electron'

export default function(mainWindow) {
    const isDev = process.env.NODE_ENV === 'development'
    const winURL = isDev ? `http://localhost:9080` : `file://${__dirname}/index.html`

    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        height: 600,
        useContentSize: true,
        width: 1000,
        resizable: true
    })

    mainWindow.loadURL(winURL)
    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
    mainWindow.on('closed', () => {
        mainWindow = null
    })
    return mainWindow
}
