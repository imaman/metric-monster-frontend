<template>
  <div id="app">
    <div class="nav-bar">      
    <router-link class="nav-entry" v-bind:to="dashboardPath('main')">main</router-link>
    <router-link class="nav-entry" v-bind:to="dashboardPath('lowdensity')">low density</router-link>
    <router-link class="nav-entry" v-bind:to="dashboardPath('self')">self</router-link>
    <router-link class="nav-entry" v-bind:to="routePath('', 'backstage')">backstage</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script>
export default {
  methods: {
    dashboardPath: function(x) {
      return this.routePath('dashboard', x);
    },
    routePath: function(prefix, val) {
      const obj = {
        endTime: this.$route.query.endTime,
        duration: this.$route.query.duration
      }
      const q = Object.entries(obj).map(([k, v]) => v && `${k}=${v}`).filter(Boolean).join('&');
      const path = (prefix ? prefix + '/' : '') + val;
      return `/${path}?${q}`;
    }
  }
}
</script>

<style>

.nav-bar {
  background: gray;
  min-height: 40px;
  position: relative;
  left: 160px;
  width: 80%;
}

.nav-entry {
  display: inline-block;
  margin-left: 5px;
  margin-right: 5px;
  color: white;
  background: gray;  
  padding: 10px;
  text-decoration: none;
  font-size: 20px;
}
.nav-entry.router-link-active {
  font-weight: bolder;
}

#app {
  position: relative;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

</style>
