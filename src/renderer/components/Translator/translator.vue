<template>
    <div class="translator" v-if="fileName">
        <trans-grid ref="grid" @onSelect="onSelect" :data="tableData" :fileInitData="fileInitData" :pristineData="pristineTableData" :columns="gridColumns" :filter-key="searchQuery"></trans-grid>
    </div>
</template>

<script>
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import transGrid from '@/components/Translator/grid'
import { Queue } from '@/common/queue'
import _ from 'lodash'
const { exec } = require('child_process')
export default {
    name: 'translator',
    props: ['files', 'i18nDir'],
    components: { transGrid },
    computed: {
        languages() {
            if (this.files && Object.keys(this.files)) {
                const array = Object.keys(this.files)
                array.unshift('key')
                return array
            }
            return []
        },
        fileName() {
            return this.$store.state.base.fileName
        },
        isChanged() {
            return this.$refs.grid && this.$refs.grid.isChanged
        }
    },
    watch: {
        fileName() {
            this.loadFiles(true)
        }
    },
    data() {
        return {
            searchQuery: '',
            gridColumns: [],
            gridData: [],
            currentRows: [],
            tableData: null,
            pristineTableData: null,
            fileInitData: null,
            loading: false,
            height: document.querySelector('body').clientHeight - 60,
            debounceError: null
        }
    },
    created() {
        this.$bus.$on('add', () => {
            this.add()
        })
        this.$bus.$on('search', val => {
            this.searchQuery = val
        })
        this.$bus.$on('delete', () => {
            this.deleteItem()
        })
        this.$bus.$on('trans', () => {
            this.trans()
        })
        this.$bus.$on('trans-all', () => {
            this.transAll()
        })
        this.$bus.$on('commit', () => {
            this.commit()
        })
        this.$bus.$on('save', _.throttle(this.save, 500))
        this.$bus.$on('reset', () => {
            this.reset()
        })
        this.$bus.$on('reset-all', () => {
            this.resetAll()
        })
        this.$bus.$on('diff', () => {
            this.diff()
        })

        this.debounceError = _.debounce(this.showError, 500)

        document.body.addEventListener('keydown', this.onKeyConbination_CMD_S)
    },
    beforeDestroy() {
        this.$bus.$off('add')
        this.$bus.$off('search')
        this.$bus.$off('delete')
        this.$bus.$off('trans')
        this.$bus.$off('trans-all')
        this.$bus.$off('commit')
        this.$bus.$off('save')
        this.$bus.$off('reset')
        this.$bus.$off('reset-all')
        this.$bus.$off('diff')
        window.removeEventListener('keydown', this.onKeyConbination_CMD_S)
    },
    methods: {
        onKeyConbination_CMD_S(e) {
            if (e.code === 'KeyS' && e.metaKey) {
                this.$bus.$emit('save', true)
            }
        },
        onSelect(val) {
            this.currentRows = val
        },
        add() {
            const isSorted = this.$refs.grid.isSorted
            if (isSorted) {
                this.$message({
                    message: `Can't add row by sort`,
                    type: 'error',
                    duration: 3000
                })
                return
            }
            const obj = JSON.parse(JSON.stringify(this.tableData.slice(0, 1)[0]))
            for (let key of Object.keys(obj)) {
                obj[key] = ''
            }
            let index = 0
            if (this.currentRows && this.currentRows.length) {
                index = this.currentRows[0]
            }
            this.defineObj(obj, 'isNew', true)
            this.defineObj(obj, 'hash', this.getRandomKey())
            this.tableData.splice(index, 0, obj)
        },
        getRandomKey() {
            return Math.random()
                .toString(36)
                .substr(2)
        },
        defineObj(obj, key, value) {
            Object.defineProperty(obj, key, {
                enumerable: false,
                value,
                configurable: true,
                writable: true
            })
        },
        deleteItem() {
            if (!this.currentRows.length) {
                this.$message({
                    message: 'Not select!',
                    type: 'warning',
                    duration: 3000
                })
                return
            }
            let key = this.tableData[this.currentRows[0]].key
            if (
                confirm(
                    'Do you want to delete ' +
                        (this.currentRows.length > 1 ? this.currentRows.length + ' row' : key || 'this row') +
                        '?'
                )
            ) {
                this.currentRows = this.currentRows.sort((a, b) => a - b)
                while (this.currentRows.length) {
                    const index = this.currentRows.pop()
                    this.tableData.splice(index, 1)
                }
                this.$refs.grid.activeRows = []
            }
        },
        trans() {
            if (!this.currentRows.length) {
                this.$message({
                    message: 'Not select!',
                    type: 'warning',
                    duration: 3000
                })
                return
            }
            const q = new Queue()
            q.add(() => {
                this.$message({
                    message: 'Translate Tasks Star!',
                    type: 'success',
                    duration: 2000
                })
            })
            // q.setConcurrency(2)

            this.currentRows
                .sort((a, b) => a - b)
                .map(index => this.tableData[index])
                .forEach(row => {
                    this.transQueue(q, row)
                })

            q.add(() => {
                this.$message({
                    message: 'Translate Task Finished!',
                    type: 'success',
                    duration: 3000
                })
            })
        },
        transQueue(q, item) {
            const sourceLang = 'zh-CN'
            Object.keys(item)
                .filter(targetLang => !(targetLang === 'key' || targetLang === sourceLang))
                .filter(targetLang => item[targetLang] === '')
                .forEach(targetLang => {
                    q.add(() => {
                        return new Promise(async function(resolve, reject) {
                            try {
                                const resultText = await this.execTrans(sourceLang, targetLang, item[sourceLang])
                                if (resultText && resultText.length) {
                                    item[targetLang] = /^[a-z]/.test(resultText)
                                        ? resultText.slice(0, 1).toUpperCase() + resultText.slice(1)
                                        : resultText
                                    resolve()
                                }
                            } catch (error) {
                                this.debounceError()
                                q.clean()
                            }
                        }.bind(this))
                    })
                })
        },
        transAll() {
            if (confirm('do you want to trans all keys?')) {
                const q = new Queue()
                q.add(() => {
                    this.$message({
                        message: 'Translate Tasks Star!',
                        type: 'success',
                        duration: 2000
                    })
                })
                this.tableData.forEach((item, index) => {
                    this.transQueue(q, item)
                })
                q.add(() => {
                    this.$message({
                        message: 'Translate finished!',
                        type: 'success',
                        duration: 3000
                    })
                })
            }
        },
        showError(error) {
            this.$notify.error({
                title: 'Error',
                message: `${error} \nIt seems that google thinks that you are trying to abuse their services, so google is blocking you. \nchange IP or retry later, good luck !`,
                duration: 5000
            })
        },
        execTrans(sourceLang, targetLang, sourceText) {
            const url =
                'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
                sourceLang +
                '&tl=' +
                targetLang +
                '&dt=t&q=' +
                encodeURI(sourceText)
            return axios.get(url).then(response => {
                return response.data[0][0][0]
            })
        },
        loadFiles(isReset) {
            this.loading = true
            setTimeout(() => {
                this.updateTableData(this.files, isReset)
                this.loading = false
            }, 200)
        },
        updateTableData(files, isReset) {
            const languages = Object.keys(files)
            const defaultLanguage = 'zh-CN'
            this.gridColumns = Array.from(new Set(['key', defaultLanguage, ...languages]))
            const result = []
            const fileName = this.fileName
            let transJSONCollection = {}

            function onError() {
                this.loading = false
                this.tableData = null
                this.$store.dispatch('base/setFileName', { name: null })
            }

            Object.keys(files).forEach(language => {
                const translators = files[language]
                const findTrans = translators.find(item => item.name === fileName)
                if (!findTrans) {
                    onError.call(this)
                    throw new Error("Can't find the translator file")
                }
                const transPath = findTrans.path
                const transString = fs.readFileSync(transPath, 'utf-8')
                try {
                    transJSONCollection[language] = JSON.parse(transString)
                } catch (error) {
                    onError.call(this)
                    this.$message({
                        message: 'Load file error',
                        type: 'error',
                        duration: 3000
                    })
                }
            })

            Object.keys(transJSONCollection[defaultLanguage]).forEach(key => {
                const obj = { key }
                this.defineObj(obj, 'hash', this.getRandomKey())
                Object.keys(files).forEach(language => {
                    obj[language] = transJSONCollection[language][key]
                })
                result.push(obj)
            })
            this.tableData = result
            this.pristineTableData = result.reduce((pre, cur) => {
                pre[cur.key] = { ...cur }
                return pre
            }, {})
            if (isReset) {
                this.fileInitData = this.pristineTableData
            }
        },
        save() {
            const isChanged = this.isChanged
            if (!isChanged) {
                return
            }
            let afterTransJSONCollection = {}
            const languages = JSON.parse(JSON.stringify(this.tableData.slice(0, 1)[0]))
            delete languages.key

            Object.keys(languages).forEach(language => {
                afterTransJSONCollection[language] = {}
            })

            Object.keys(languages).forEach(language => {
                this.tableData.forEach(item => {
                    afterTransJSONCollection[language][item.key] = item[language] ? item[language] : ''
                })
            })

            Object.keys(afterTransJSONCollection).forEach(language => {
                const data = this.sortByKey(afterTransJSONCollection[language])
                const isIllegalKey = Object.keys(data).filter(key => (key === '' || key === null))
                if (isIllegalKey && isIllegalKey.length) {
                    isIllegalKey.forEach(key => {
                        delete data[key]
                    })
                }
                const string = JSON.stringify(data, null, 4)
                const filePath = path.join(this.i18nDir, language, `${this.fileName}.json`)
                fs.writeFileSync(filePath, string, { encoding: 'utf-8' })
            })
            this.loadFiles()
            this.$message({
                message: `Save success`,
                type: 'success',
                duration: 3000
            })
        },
        sortByKey(data) {
            const dataArray = Object.keys(data).map(key => ({ key, value: data[key] }))
            const sortedArray = dataArray.sort((a, b) => {
                a = a['key']
                b = b['key']
                return a === b ? 0 : a > b ? -1 : 1
            })
            return sortedArray.reverse().reduce((pre, cur) => {
                pre[cur.key] = cur.value
                return pre
            }, {})
        },
        commit() {
            alert('The service is temporarily unavailable')

            // series(
            //     ['git add -A', 'git commit -m UpdateI18nFiles', 'git push origin dev'],
            //     { cwd: this.i18nDir },
            //     function(err) {
            //         if (!err) {
            //             this.$message({
            //                 message: 'Success',
            //                 type: 'success',
            //                 duration: 3000
            //             })
            //         } else {
            //             this.$message({
            //                 message: err,
            //                 type: 'error',
            //                 duration: 3000
            //             })
            //         }
            //     }
            // )
        },
        reset() {
            if (confirm('Do you want reset this group?')) {
                Object.keys(this.files).forEach(language => {
                    const filePath = path.join(this.i18nDir, language, this.fileName) + '.json'
                    this.exec(`git checkout ${filePath}`, { cwd: null, quiet: true })
                })
                this.loadFiles()
                this.$message({
                    message: `Success`,
                    type: 'success',
                    duration: 3000
                })
            }
        },
        resetAll() {
            if (confirm('Do you want reset all changes?')) {
                this.exec('git checkout .')
                if (this.fileName) {
                    this.loadFiles()
                    this.$message({
                        message: `Success`,
                        type: 'success',
                        duration: 3000
                    })
                }
            }
        },
        diff() {
            this.exec(`git webdiff`, {
                quiet: true,
                ifTranquil: () => {
                    this.$message({
                        message: 'Nothing changes',
                        type: 'warning',
                        duration: 3000
                    })
                }
            })
        },
        exec(cmd, { quiet, cwd, ifTranquil } = {}) {
            exec(
                cmd,
                {
                    cwd: cwd || this.i18nDir
                },
                (error, stdout, stderr) => {
                    if (error && !quiet) {
                        this.$message({
                            message: `exec error: ${error}`,
                            type: 'error',
                            duration: 3000
                        })
                        return
                    }
                    if (stdout && !quiet) {
                        this.$message({
                            message: `${stdout}`,
                            type: 'info',
                            duration: 3000
                        })
                        return
                    }
                    if (!error && !quiet) {
                        this.$message({
                            message: `Success`,
                            type: 'success',
                            duration: 3000
                        })
                        return
                    }
                    if (ifTranquil) ifTranquil()
                }
            )
        }
    }
}
</script>

<style scoped>
.translator {
    padding-top: 60px;
    margin-left: 180px;
}
</style>

