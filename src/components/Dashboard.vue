<template>
  <div class="dashboard">
    <!-- By explicitly referring to the duration and endTime props from the template,
      we trick  vue into re-rendering the component when this prop changes. thsis
      property affect the JS code but not the rendered template. -->
    <span style="display:none">{{specName}}</span>

    <TimeframeSelector v-on:duration-changed="durationChanged" v-bind:durationV="durationString" v-bind:endTimeInMsV="endTimeInMs"></TimeframeSelector>
    <div class="widget-container" v-bind:class="{'single-column': isSingle}">
      <Widget v-for="curr in this.computeWidgetData()" :key="curr.id"
        v-bind:unit="unit"
        v-bind:duration="getDuration()"
        v-bind:endTime="getEndTime()"
        v-bind:spec="curr.spec" 
        v-bind:url="curr.url">
      </Widget>
    </div>
  </div>
</template>


<script>
import Widget from '@/components/Widget.vue'
import TimeframeSelector from '@/components/TimeframeSelector.vue'
import moment from 'moment';
import ms from 'ms';
import { specByName } from '@/logic/dashboardSpecs.js'
import { normalizeDurationString } from '@/logic/durations'


function normalizeEndTime(timeString) {
  if (!timeString) {
    return -1;
  }

  try {
    const [ignore, y, m, d, h, min] = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/.exec(timeString)  // eslint-disable-line no-unused-vars
    timeString =  `${y}-${m}-${d}T${h}:${min}:00.000Z`;
  } catch (e) {
    // Fallback to standard moment parsing.
  }


  const mom = moment.utc(timeString);
  return mom.valueOf();
}

function normalizePick(arg) {
  if (arg === '' || arg === null || arg == undefined) {
    return null;
  }

  return Buffer.from(arg, 'base64').toString();
}

function choose(specName, specList, overridingValue) {
  return overridingValue ? [JSON.parse(overridingValue)] : specList;
}

export default {
  name: 'dashboard',
  props: {
    specName: {type: String, required: true},
  },
  data: function() {
    const durationAndUnit = normalizeDurationString(this.$route.query.duration);
    return {
      endTimeInMs: normalizeEndTime(this.$route.query.endTime),
      durationString: durationAndUnit.durationString,
      unit: durationAndUnit.unit,
      isSingle: Boolean(normalizePick(this.$route.query.spec))
    }
  },
  methods: {
    computeWidgetData() {
      return this.activeSpecs().map(spec => {
        const url = this.buildUrl(spec);
        return {spec, url, id: url};
      });
    },
    activeSpecs() {
      return choose(this.specName, this.lookupSpecs(), normalizePick(this.$route.query.spec));
    },
    lookupSpecs() {
      const name = this.specName || 'main';
      const ret = specByName[name];
      if (!ret) {
        throw new Error('Failed to find spec name "' + name + '" in ' + Object.keys(specByName).join(','));
      }
      return ret;
    },
    getEndTime() {
      return this.endTimeInMs < 0 ? Date.now() : this.endTimeInMs;
    },
    getDuration() {
      return ms(this.durationString);
    },
    buildUrl(spec) {
      const specEncoded = Buffer.from(JSON.stringify(spec)).toString('base64');
      return `#?endTime=${moment(this.getEndTime()).utc().format('YYYY-MM-DD-HHmm')}&duration=${this.durationString}&spec=${specEncoded}`
    },
    durationChanged(arg) {
      this.durationString = arg.durationString;
      this.endTimeInMs = arg.endTimeInMs;
      this.unit = arg.unit;
      const newLoc = {
        query: {
          endTime: moment(this.getEndTime()).utc().format('YYYY-MM-DD-HHmm'),
          duration: this.durationString,
          spec: this.$route.query.spec
        }
      };
      this.$router.replace(newLoc);
    }
  },
  components: {
    Widget,
    TimeframeSelector
  }
}
</script>

<style>

body {
  margin: 0px;
}

</style>


<style scoped>
.widget-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
}

@media only screen and (max-width: 1000px)  {
	.widget-container {
		grid-template-columns: 1fr;
	}
}

.single-column {
  grid-template-columns: 1fr;
}
</style>
