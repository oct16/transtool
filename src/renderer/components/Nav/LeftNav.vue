<template>
    <div class="left-nav">
        <el-menu @select="handleSelect" background-color="#545c64" text-color="#fff" active-text-color="#ffd04b">
            <el-menu-item :index="fileName" v-bind:key="fileName" v-for="fileName of filesMenu">
                <span class="pl-3" slot="title">{{ fileName }}</span>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<script>
export default {
    name: 'left-nav',
    props: ['files'],
    data() {
        return {
            currentName: ''
        }
    },
    computed: {
        filesMenu() {
            const files = this.files[Object.keys(this.files)[0]]
            if (files && files.length) {
                return files.map(item => item.name)
            }
            return []
        }

    },
    methods: {
        handleSelect(name) {
            if (name === this.currentName) {
                return
            }
            const gridInstant = this.$parent.$refs.translator.$refs.grid
            if (gridInstant) {
                const isChanged = gridInstant.isChanged
                if (isChanged) {
                    if (confirm('Changed is not save, if jump to other module will lost the changes, are you sure? ')) {
                        this.$store.dispatch('base/setFileName', {name}).then(() => {
                            this.currentName = name
                        })
                    }
                    return
                }
                gridInstant.cleanSelects()
            }
            this.$store.dispatch('base/setFileName', {name}).then(() => {
                this.currentName = name
            })
        }
    }
}
</script>

<style scoped>
    .left-nav {
        margin-top: 60px;
        width: 180px;
        position: fixed;
        z-index: 100;
        height: calc(100% - 60px);
        background: rgb(84, 92, 100)
    }

    .el-menu {
        border: none
    }
</style>
