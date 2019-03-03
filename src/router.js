import Vue from 'vue'
import Router from 'vue-router'
import MainDashboard from './views/MainDashboard.vue'
import Backstage from './views/Backstage.vue'

Vue.use(Router)


const router = new Router({
  routes: [
    {
      path: '/',
      alias: '/dashboard',
      component: MainDashboard,
      props: true,
    },
    {
      path: '/dashboard/:specName',
      component: MainDashboard,
      props: true,
    },
    {
      path: '/backstage',
      component: Backstage,
      meta: {title: 'backstage'}
    }
  ]
});

// This callback runs before every route change, including on page load.
router.beforeEach((to, _from, next) => {
  // This goes through the matched routes from last to first, finding the closest route with a title.
  // eg. if we have /some/deep/nested/route and /some, /deep, and /nested have titles, nested's will be chosen.
  const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title);

  const specName = to.params.specName;
  const suffix = specName || nearestWithTitle && nearestWithTitle.meta.title;


  // If a route with a title was found, set the document (page) title to that value.
  document.title = "MetricMonster " + (suffix ? ` - ${suffix}` : '');

  next();
});

export default router;

