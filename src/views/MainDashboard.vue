<template>
    <Dashboard v-bind:specName="specName">
    </Dashboard>
</template>

<script>
import Dashboard from '@/components/Dashboard.vue'



export default {
  name: 'mainDashboard',
  props: {
    specName: {type: String, default: 'main'}
  },
  data: function() {
    return {}
  },
  methods: {
  },
  components: {
    Dashboard
  }
}
</script>

<style>
</style>


<style scoped>
</style>
