import { createApp } from 'vue'
import App from './App.vue'

import {Notify, Quasar} from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './assets/main.css'

const app = createApp(App)

app.use(Quasar, {
    plugins: {
        Notify
    }
})

app.mount('#app')
