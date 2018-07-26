<template>
    <div class="translator-main">
        <left-nav :files="files"></left-nav>
        <translator ref="translator" :files="files" :i18nDir="i18nDir"></translator>
    </div>
</template>

<script>
import path from 'path'
import fs from 'fs'
import leftNav from '@/components/Nav/leftNav'
import translator from '@/components/Translator/translator'
export default {
    name: 'index',
    components: {
        leftNav,
        translator
    },
    data() {
        return {
            files: {},
            i18nDir: null
        }
    },
    async beforeRouteLeave(to, from, next) {
        const gridInstant = this.$refs.translator.$refs.grid
        if (gridInstant) {
            let isNext = true
            const isChanged = gridInstant.isChanged
            if (isChanged) {
                if (
                    !confirm(
                        'Changed is not save, if jump to other module will lost the changes, are you sure? '
                    )
                ) {
                    isNext = false
                }
            }
            next(isNext)
            return
        }
        next()
    },
    created() {
        this.getProjectFiles()
    },
    computed: {
        projectPath() {
            return this.$store.state.base.projectPath
        }
    },
    methods: {
        getFiles(dirPath, isChild) {
            const dirs = fs.readdirSync(dirPath)
            let result
            if (isChild) {
                result = []
            } else {
                result = {}
            }
            dirs.forEach(file => {
                const filePath = path.resolve(dirPath, file)
                if (fs.statSync(filePath).isDirectory()) {
                    const files = this.getFiles(filePath, true)
                    if (isChild) {
                        result = result.concat(files)
                    } else {
                        result[file] = files
                    }
                } else {
                    if (isChild) {
                        result.push({
                            name: file.replace('.json', ''),
                            path: filePath
                        })
                    }
                }
            })
            return result
        },
        matchDir(basePath, reg) {
            let result = []
            const dirs = fs.readdirSync(basePath)
            dirs.forEach(file => {
                const filePath = path.resolve(basePath, file)
                if (fs.statSync(filePath).isDirectory()) {
                    if (!/(node_module|.git|.components)/.test(filePath)) {
                        if (reg.test(filePath)) {
                            result.push(filePath)
                        }
                        const files = this.matchDir(filePath, reg)
                        result = result.concat(files)
                    }
                }
            })
            return result
        },
        getProjectFiles() {
            if (!this.projectPath) return
            const result = this.matchDir(path.resolve(this.projectPath), /src\/assets\/i18n$/)
            if (result) {
                const i18nDir = (this.i18nDir = result[0])
                const files = this.getFiles(i18nDir)
                this.files = files
            }
        }
    },
    watch: {
        projectPath() {
            this.getProjectFiles()
        }
    }
}
</script>

<style scoped>
.translator-main {
    height: calc(100% - 60px);
}
</style>
