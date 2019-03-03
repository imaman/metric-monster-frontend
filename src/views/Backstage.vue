<template>
  <div class="main">
    <h1>Backstage</h1>
    <div class="header">
      <span>Sampled at {{sampledAt}}</span>
      &nbsp;
      <span class="clickable" v-on:click="redraw()">Refresh</span>
    </div>
    <div class="metric-card">
      <div class="metric-title">Metadata</div>
      <div class="detail">numRecords: {{backendStatus.numRecords}}</div>
      <div class="detail">uptimeInSeconds: {{backendStatus.uptimeInSeconds}}</div>
    </div>
    <div class="metrics">
      <div class="metric-card" v-for="item in backendStatus.metrics" :key="item.metricName">
        <div class="metric-title">{{item.metricName}}</div>
        <div class="detail">type: {{item.type}}</div>
        <div class="detail">numUpdates: {{item.numUpdates}}</div>
        <div class="detail">lastUpdate: {{item.lastUpdate}}</div>
        <div class="detail">numDatapoints: {{item.numDatapoints}}</div>
        <div class="detail">lastDatapoint: {{item.lastDatapoint}}</div>
        <div class="detail">lastDatapointNumUpdates: {{item.lastDatapointNumUpdates}}</div>
      </div>
    </div>
  </div>
</template>


<script>
import { callLambda } from '../logic/callLambda'
import { settings } from '../settings'

async function update(data) {
  const resp = await callLambda(settings.lambdaMetricCenter, {inspect: []});
  data.sampledAt = new Date().toISOString();    
  data.backendStatus = resp.output;
}

export default {
  name: 'backstage',
  data: function() {
    return {
      backendStatus: 'loading...',
      sampledAt: 'N/A'
    }
  },
  methods: {
    redraw() {
      update(this.$data);
    }
  },
  async mounted() {
    this.redraw();
  },
  components: {}
}
</script>


<style>

body {
  margin: 0px;
}

</style>

<style scoped>

.link-item {
  padding-left: 5px;
  padding-right: 5px;
}

.metrics {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 10px;
}

.metric-card {
  background-color: beige;
  white-space: pre;
  font-family: 'Courier New', Courier, monospace;
  text-align: start;
  padding-bottom: 10px;
}

.metric-title {
  text-align: center;
  background-color: lightgreen;
  padding: 5px 5px 5px 5px;
  margin-bottom: 10px;
}

.clickable {
  text-align: start;
  cursor: pointer;
  font-weight: 900;
  padding: 12px;
  border-radius: 8px;
  border-width: 2px;
  border-style: solid;
  border-color: bisque;
  background-color: bisque;
}

.clickable:hover {
  background-color: beige;
  border-color: beige;
}

.clickable:active {
  border-color: burlywood;
}

.header {
  margin-bottom: 30px;
}

.main {
  margin-left: 10px;
  margin-right: 10px;
}

</style>
