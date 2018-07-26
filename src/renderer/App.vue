<template>
    <div id="app">
        <AppHeader></AppHeader>
        <router-view></router-view>
        <AppFooter></AppFooter>
    </div>
</template>

<script>
import AppHeader from '@/components/Header'
import AppFooter from '@/components/Footer'

const initData = function() {
    const projectPath = localStorage.getItem('dirPath')
    this.$nextTick(() => {
        if (projectPath) {
            this.$store.dispatch('base/setProjectPath', { path: projectPath })
            this.$router.push({ name: 'project' })
        }
    })
}

export default {
    name: 'transtool',
    components: { AppHeader, AppFooter },
    created() {
        initData.bind(this)()
    }
}
</script>

<style>
body,
html,
#app {
    margin: 0;
    padding: 0;
    height: 100%;
    user-select: none;
}
</style>


