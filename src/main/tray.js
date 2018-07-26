import { Tray } from 'electron'

export default function(window) {
    const menubarPic =
            process.platform === 'darwin'
                ? `${__static}/icons/icon.png`
                : `${__static}/icons/icon.png`
    const tray = new Tray(menubarPic)

    const toggleWindow = () => {
        if (window.isVisible()) {
            window.hide()
        } else {
            showWindow()
        }
    }

    const showWindow = () => {
        const position = getWindowPosition()
        window.setPosition(position.x, position.y, false)
        window.webContents.send('updateFiles')
        window.show()
        window.focus()
    }

    const getWindowPosition = () => {
        const windowBounds = window.getBounds()
        const trayBounds = tray.getBounds()
        const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
        const y = Math.round(trayBounds.y + trayBounds.height - 10)

        return {
            x,
            y
        }
    }

    tray.on('click', () => {
        if (!window.isDestroyed()) {
            if (process.platform === 'darwin') {
                toggleWindow()
            } else {
                window.hide()
            }
        }
    })
}
