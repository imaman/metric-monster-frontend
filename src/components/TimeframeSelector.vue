<template>
  <div class="timeframe-selector-wrapper">
    <span class="timeframe-selector">
      <span title="Step to an earlier timeframe (Keyboard: Shift+Left-Arrow)" class="clickable" v-on:click="earlier()">&#9665;</span>
      <span title="Step to a later timeframe (Keyboard: Shift+Right-Arrow)" class="clickable" v-on:click="later()">&#9655;</span>
      <span class="value">{{this.formatTime()}}</span>
    </span>
    <span>&nbsp;&nbsp;&nbsp;</span>
    <span class="timeframe-selector">
      <span title="Zoom in: decrease the duration (Keyboard: Shift+Down-Arrow)" class="clickable" v-on:click="dec()">&#9661;</span>
      <span title="Zoom out: increase the duration (Keyboard: Shift+Up-Arrow)" class="clickable" v-on:click="inc()">&#9651;</span>
      <span class="value duration">{{this.formatDuration()}}</span>
    </span>
  </div>
</template>

<script>

import moment from 'moment'
import {durations, findDurationIndex, durationStringToMs} from '@/logic/durations'


export default {
  name: 'TimeframeSelector',
  props: {
    durationV: {type: String, required: true},
    endTimeInMsV: {type: Number, required: true}
  },
  data() {
    return {
      durationIndex: findDurationIndex(this.durationV),
      durationString: this.durationV,
      endTimeInMs: this.endTimeInMsV
    };
  },
  created: function () {
    window.addEventListener('keyup', this.onkey)
  },
  beforeDestroy: function () {
    window.removeEventListener('keyup', this.onkey)
  },    
  methods: {
    onkey(event) {
      const key = event.key;
      if (key === 'ArrowLeft' && event.shiftKey) {
        return this.earlier();
      }

      if (key === 'ArrowRight' && event.shiftKey) {
        return this.later();
      }

      if (key === 'ArrowUp' && event.shiftKey) {
        return this.inc();
      }

      if (key === 'ArrowDown' && event.shiftKey) {
        return this.dec();
      }
    },
    formatTime() {
      if (this.endTimeInMs < 0) {
        return 'NOW';
      }
      return moment.utc(this.endTimeInMs).toISOString()
    },
    formatDuration() {
      return this.durationString;
    },
    fire() {
      const d = this.currentDuration();
      this.$emit('duration-changed', {durationString: this.durationString, endTimeInMs: this.endTimeInMs, unit: d.u});
    },
    currentDuration() {
      return durations[this.durationIndex];
    },
    stepSize() {
      return Math.round(durationStringToMs(this.durationString) / 2);
    },
    dec() {
      this.durationIndex = Math.max(0, this.durationIndex - 1);
      this.durationString = this.currentDuration().s;
      console.log('\\/');
      this.fire();
    },
    inc() {
      this.durationIndex = Math.min(durations.length - 1, this.durationIndex + 1);
      this.durationString = this.currentDuration().s;
      console.log('/\\');
      this.fire();
    },
    earlier() {
      if (this.endTimeInMs < 0) {
        this.endTimeInMs = timeNow();
      }

      this.endTimeInMs -= this.stepSize();
      this.endTimeInMs = Math.max(this.endTimeInMs, 0);
      console.log('<-');
      this.fire();
    },
    later() {
      if (this.endTimeInMs < 0) {
        this.endTimeInMs = timeNow();
        console.log('<|>');
        this.fire();
        return;
      }
      this.endTimeInMs += this.stepSize();
      this.endTimeInMs = Math.min(this.endTimeInMs, timeNow());
      console.log('->');
      this.fire();
    }
  }
}

function timeNow() {
  const temp = Date.now();
  return temp - temp % 1000;
}


</script>

<style scoped>
.value {
  display: inline-block;
  text-align: end;
  min-width: 500px;
  width: 500px;
}

.value.duration {
  min-width: 100px;
  width: 100px;
}

.timeframe-selector-wrapper {
  user-select: none;
  padding: 12px;
}

.timeframe-selector {
  padding: 6px;
  font-size: 24px;
  background-color: lightgray;
  border-radius: 12px;
}

.clickable {
  text-align: start;
  cursor: pointer;
  font-weight: 900;
  padding: 12px;
}
</style>


