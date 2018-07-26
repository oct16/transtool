import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import 'element-ui/lib/theme-chalk/index.css'

import '~/bootstrap/dist/css/bootstrap.min.css'
import '@/assets/nprogress-bar.css'

require('./element-ui').default(Vue)

Vue.prototype.$bus = new Vue()

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')
