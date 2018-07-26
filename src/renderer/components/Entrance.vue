<template>
    <div>
        <el-button class="center-btn" @click="openDir()">{{projectPath ? '更改目录': '打开目录'}}</el-button>
    </div>
</template>

<script>
import { openDir } from '@/common/dialog'
export default {
    name: 'entrance',
    created() {
        this.$store.dispatch('base/setFileName', {name: null})
    },
    methods: {
        openDir() {
            openDir(paths => {
                if (paths) {
                    const [path] = paths
                    localStorage.setItem('dirPath', path)
                    this.$router.push({ name: 'project' })
                    this.$nextTick(() => {
                        this.$store.dispatch('base/setProjectPath', { path })
                    })
                }
            })
        }
    },
    computed: {
        projectPath() {
            return this.$store.state.base.projectPath
        }
    }
}
</script>

<style>
    .center-btn {
        position: absolute;
        margin-left: -50px;
        margin-top: -20px;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 40px;
    }
</style>;
