import Vue from 'vue'
import App from './App.vue'
import router from './router'
import auth from './auth'

Vue.config.productionTip = false

function run() {
  new Vue({
    router,
    render: h => h(App)
  }).$mount('#app')  
}


global.npm_metric_monster_frontend_onSignIn = async googleUser => {
  try {
    await auth(googleUser);
    run();
  } catch (e) {
    console.log('Failure', e);
    alert('Oops\n' + e.message);
  }
};


