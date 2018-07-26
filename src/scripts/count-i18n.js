const fs = require('fs')
const P = require('path')

let i18nKeys

export const getKeys = (path, cb) => {
    i18nKeys = {}
    const dir = fsExistsSync(P.join(path, '/client/src')) || fsExistsSync(P.join(path, '/src'))
    const files = getAllFiles(dir)
    const htmlFiles = files.filter(path => path.endsWith('.html'))
    const tsFiles = files.filter(path => path.endsWith('.ts'))
    matchKeys(tsFiles, /["'](\w+\.)+\w+["']/g)
    matchKeys(htmlFiles, /["']([\w.+]*)["']\s?\|\s?translate/g)
    if (cb) cb(i18nKeys)
}

const fsExistsSync = (path) => {
    try {
        fs.accessSync(path, fs.F_OK)
    } catch (e) {
        return false
    }
    return path
}

const matchKeys = (files, reg) => {
    files.forEach(filePath => {
        const fileString = fs.readFileSync(filePath, 'utf-8')
        const matches = fileString.match(reg)
        const result = !matches ? null : matches.map(string => string.match(/["'](.*)["']/)[1])
        if (result) {
            counting(result)
        }
    })
}

const counting = stringList => {
    stringList.forEach(key => {
        if (!i18nKeys[key]) {
            i18nKeys[key] = 0
        }
        i18nKeys[key]++
    })
}

const getAllFiles = rootPath => {
    let res = []
    const files = fs.readdirSync(rootPath)
    files.forEach(file => {
        const pathname = rootPath + '/' + file
        const stat = fs.lstatSync(pathname)
        if (!stat.isDirectory()) {
            res.push(pathname)
        } else {
            res = res.concat(getAllFiles(pathname))
        }
    })
    return res
}
