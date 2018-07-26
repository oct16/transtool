const {dialog} = require('electron').remote

export const openDir = function(callback) {
    dialog.showOpenDialog(
        {
            properties: ['openFile', 'openDirectory'],
            message: 'Select Project Directory'
        }, (filePath) => {
            callback(filePath)
        })
}
