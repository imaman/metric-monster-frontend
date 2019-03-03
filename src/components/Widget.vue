<template>
  <div class="widget">
    <!-- By explicitly referring to the duration and endTime props from the template,
      we trick  vue into re-rendering the component when this prop changes. These 
      property affect the JS code but not the rendered template. -->
    <span style="display:none">{{duration}}{{endTime}}{{unit}}</span>
    <div class="title"><a target="_blank" v-bind:href="url">{{ spec.title || spec.metricName }}</a></div>
    <div class="chart">
      <div style="position: relative;">
        <canvas ref="canvas" width="360" height="120"></canvas>
      </div>      
      <div ref="tooltip" class="tooltip">
        <span class="time-indicator">{{tooltipTitle}}&nbsp;&nbsp;</span>
        <span class="value-indicator">
          <span style="text-align:right">{{tooltipBody}}</span>
          <span style="text-align:left"> {{curveName}}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>


import Chart from 'chart.js'

import moment from 'moment-timezone'
moment.tz.setDefault('UTC');

import TimeseriesSupplier from './TimeseriesSupplier'

function initChart(canvasElement, componentData) {
  const ctx = canvasElement.getContext('2d');

  return new Chart(ctx, {
      type: 'line',
      data: {},
      options: {
        animation: {
            duration: 0, // general animation time
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
				responsive: true,
				tooltips: {
          enabled: false,
          custom: m => customTooltipCallback(componentData, m),
					mode: 'nearest',
					intersect: false,
				},
				hover: {
					mode: 'nearest',
					intersect: false,
          animationDuration: 0, // duration of animations when hovering an item
        },
        legend: {
          position: 'bottom'
        },
        scales: {
          xAxes: [{
            type: 'time',
            position: 'bottom',
            time: {
              parser: function(x) {
                return moment(x).utc();
              },
              unit: 'minute',
              tooltipFormat: 'YYYY-MM-DDTHH:mm:ss',
              displayFormats: {
                minute: 'HH:mm',
                hour: 'MM-DD HH:mm',
                day: 'YY-MM-DD'
              }              
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
            }
          }]
        }
      }
  });
}


const PALLETE = ["#5899DA", "#E8743B", "#19A979", "#ED4A7B", "#945ECF", "#13A4B4", "#525DF4", "#BF399E", "#6C8893", "#EE6868", "#2F6497"];
const timeseriesSupplier = new TimeseriesSupplier();

async function updateChart(chart, componentData, baseSpec, endTimeInMs, durationInMs, unit, revision) {
  if (durationInMs <= 0) {
    throw new Error('Duration must be positive');
  }
  const startTimeInMs = endTimeInMs - durationInMs;
  const spec = Object.assign({}, {legend: true}, baseSpec);
  const resp = await timeseriesSupplier.getDatapoints(spec, startTimeInMs, endTimeInMs);

  if (revision !== componentData.revision) {
    // A more recent updateChart() is in progress. Drop this one.
    return;
  }

  let colorIndex = -1;
  const arr = resp.output.map((points, i) => {
    const seriesNames = Object.keys(points.values);
    seriesNames.sort();
    // We reverse the colors. Rationale: in most usage scernarios the user typically starts from the present and
    // then, optionally, moves back to the past. Also, in many data sources, there is some order on the names (e.g., 
    // git tags of releases of a repo). By reverse sorting we ensure that the highest seriesnames is always first
    // and gets the first color. Specifically, when the user sees it on the initial rendering it will get some color X. 
    // as the user expands the timeframe additional series names may come into view. these series names have lower values.
    // reverse sorting ensures that the "higher" seriesNames (which were already seen) will not changes their color as "lower"
    // ones come into view.
    seriesNames.reverse();
    const datasets = seriesNames.map(s => {
      ++colorIndex;
      const color = PALLETE[colorIndex % PALLETE.length];
      let label = (s === 'DEFAULT' && spec.queries) ? (spec.queries[i].name || spec.queries[i].metricName): s;
      if (points.sigma && Number.isFinite(points.sigma[s])) {
        label += ` (Total = ${Number(points.sigma[s].toFixed(5))})`
      }

      const dataset = {
        pointRadius: 0,
        borderColor: color,
        backgroundColor: color,
        label,
        fill: false,
        lineTension: 0,
        data: []
      };

      points.timestamps.forEach((t, i) => {
        let v = points.values[s][i];
        if (v === null && spec.nullValue !== undefined) {
          v = spec.nullValue;
        }
        if (v !== null) {
          dataset.data.push({x: t, y: v});
        }
      });
      return dataset;
    });

    return datasets;
  });

  chart.data.datasets = [].concat(...arr);
  const xAxis = chart.options.scales.xAxes[0];
  xAxis.time.unit = unit;
  xAxis.time.min = startTimeInMs;
  xAxis.time.max = endTimeInMs;
  chart.options.legend.display = (chart.data.datasets.length > 1) && spec.legend;
  chart.update();
}


// tooltipModel example:
//
// {
//   "xPadding": 6,
//   "yPadding": 6,
//   "xAlign": "right",
//   "yAlign": "center",
//   "bodyFontColor": "#fff",
//   "_bodyFontFamily": "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//   "_bodyFontStyle": "normal",
//   "_bodyAlign": "left",
//   "bodyFontSize": 12,
//   "bodySpacing": 2,
//   "titleFontColor": "#fff",
//   "_titleFontFamily": "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//   "_titleFontStyle": "bold",
//   "titleFontSize": 12,
//   "_titleAlign": "left",
//   "titleSpacing": 2,
//   "titleMarginBottom": 6,
//   "footerFontColor": "#fff",
//   "_footerFontFamily": "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
//   "_footerFontStyle": "bold",
//   "footerFontSize": 12,
//   "_footerAlign": "left",
//   "footerSpacing": 2,
//   "footerMarginTop": 6,
//   "caretSize": 5,
//   "cornerRadius": 6,
//   "backgroundColor": "rgba(0,0,0,0.8)",
//   "opacity": 1,
//   "legendColorBackground": "#fff",
//   "displayColors": true,
//   "borderColor": "rgba(0,0,0,0)",
//   "borderWidth": 0,
//   "title": [
//     "2018-12-17 03:56:29"
//   ],
//   "beforeBody": [],
//   "body": [
//     {
//       "before": [],
//       "lines": [
//         "played: 3.86753"
//       ],
//       "after": []
//     }
//   ],
//   "afterBody": [],
//   "footer": [],
//   "x": 520.248046875,
//   "y": 261,
//   "caretPadding": 2,
//   "labelColors": [
//     {
//       "borderColor": "rgb(25, 138, 250)",
//       "backgroundColor": "rgb(25, 138, 250)"
//     }
//   ],
//   "labelTextColors": [
//     "#fff"
//   ],
//   "dataPoints": [
//     {
//       "xLabel": "2018-12-17 03:56:29",
//       "yLabel": 3.86753,
//       "index": 65,
//       "datasetIndex": 0,
//       "x": 651.7833006640626,
//       "y": 282.3683022222222
//     }
//   ],
//   "width": 124.751953125,
//   "height": 42,
//   "caretX": 652,
//   "caretY": 282
// }"
function customTooltipCallback(componentData, tooltipModel) {
  if (!tooltipModel.dataPoints) {
    return;
  }
  
  const dp = tooltipModel.dataPoints[0];
  if (!dp) {
    return;
  }

  const xValue = dp.xLabel;
  const yValue = dp.yLabel;
  const label = componentData.chart.data.datasets[dp.datasetIndex].label;
  const openParen = label.indexOf(' (');
  const curveName = openParen >= 0 ? label.substring(0, openParen) : label;

  componentData.tooltipTitle = xValue;
  componentData.tooltipBody = String(yValue || '').padStart(10, ' ');
  componentData.curveName = `(${curveName})`
}

export default {
  name: 'Widget',
  props: {
    title: {type: String},
    spec: {type: Object, required: true},
    duration: {type: Number, required: true},
    unit: {type: String, required: true},
    endTime: {type: Number, required: true},
    url: {tyep: String, required: true}
  },
  data: function() {
    return {
      revision: 0,
      chart: null,
      tooltipTitle: ' ',
      tooltipBody: ' ',
      curveName: ' ',
      lastDuration: -1,
      lastEndTime: -1
    }
  },
  methods: {
    redraw() {
      if (this.endTime === this.lastEndTime && this.duration === this.lastDuration) {
        return;
      }

      this.lastEndTime = this.endTime;
      this.lastDuration = this.duration;
      this.revision += 1;
      updateChart(this.$data.chart, this.$data, this.spec, this.endTime, this.duration, this.unit, this.revision);
    }
  },
  async beforeUpdate() {
    this.redraw();
  },
  async mounted() {
    this.$data.chart = initChart(this.$refs.canvas, this.$data);
    this.redraw();
  }
}
</script>

<style scoped>
.title {
  background-color: lightblue;
  color: darkblue;
  font-size: 28px;
  grid-area: header;
}
.chart {
  background-color: white;
  grid-area: main;
}

.tooltip {
  max-height: 48px;
  min-height: 48px;
  font-family: 'Courier New', Courier, monospace;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.time-indicator {
  text-align: right;
}

.value-indicator {
  text-align: left;
}

.widget {
  border-width: 2px;
  border-style: solid;
  border-color: lightblue;
  display: grid;
  grid-template-columns: auto;
  grid-template-areas: 
      "header"
      "main"
}
</style>


