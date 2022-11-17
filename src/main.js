import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import Buefy from 'buefy';
import App from './App.vue';
import store from './store/store';

//import 'bootstrap/dist/css/bootstrap.css';
//import 'bootstrap-vue/dist/bootstrap-vue.css';
//import 'buefy/dist/buefy.css';


Vue.use(BootstrapVue);
Vue.use(Buefy);
Vue.use(IconsPlugin);

Vue.config.productionTip = false;

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');