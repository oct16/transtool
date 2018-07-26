import Vue from 'vue'
// import path from 'path'
import Router from 'vue-router'

Vue.use(Router)
const router = new Router({
    routes: [
        {
            path: '/',
            name: 'entrance',
            component: require('@/components/Entrance.vue').default
        },
        {
            path: '/project',
            name: 'project',
            component: require('@/components/index.vue').default
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
})

export default router
