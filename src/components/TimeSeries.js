export class TimeRange {
    constructor(fromTimestamp, toTimestamp) {
      this.fromTimestamp = fromTimestamp;
      this.toTimestamp = toTimestamp;
    }
  
    isEmpty() {
      return this.fromTimestamp >= this.toTimestamp;
    }
  
    toString() {
      return `[${this.fromTimestamp}..${this.toTimestamp})`;
    }
  
    isOutsideOf(t0, t1) {
      return this.fromTimestamp >= t1 || this.toTimestamp < t0;
    }
  }
  
  export class TimeSeries {
    constructor(metricName, timeRange, timestamps = [], values = {"DEFAULT": []}) {
      this.metricName = metricName;
      this.timeRange = timeRange;
      const entries = Object.entries(values);
      if (!entries.length) {
        throw new Error(`No value stream entries were passed in`);
      }
      entries.forEach(([k, arr]) => {
        if (!Array.isArray(arr)) {
          throw new Error(`Value stream (${k}) should be an array but it is of type ${typeof arr}`);
        }
        if (arr.length !== timestamps.length) {
          throw new Error(`Mimsmatch in length in value stream (${k}): expected ${timestamps.length} but found ${arr.length}`);
        }
      });
      this.timestamps = timestamps;
      this.values = values;
    }
  
    withIdentifier(identifier) {
      this.identifier = identifier;
      return this;
    }
  
    toData() {
      const ret = {
        query: {
          metricName: this.metricName,
          timeframe: this.timeRange
        },
        timestamps: this.timestamps,
        values: this.values
      };
  
      if (this.identifier !== undefined) {
        ret.query.identifier = this.identifier;
      }
  
      return ret;
    }
    
    copyInto(that, timestampA, timestampB) {
      const newTimestamps = [];
      const newValues = {};
  
  
      const valueEntries = Object.entries(this.values);
      const valueNames = valueEntries.map(curr => curr[0]);
      valueNames.forEach(name => newValues[name] = []);
  
      for (let i = 0; i < this.timestamps.length; ++i) {
        const curr = this.timestamps[i];
        if (curr < timestampA || curr >= timestampB) {
          continue;
        }
  
        newTimestamps.push(curr);
        valueEntries.forEach(([name, arr]) => newValues[name].push(arr[i]));
      }
  
      for (let i = 0; i < that.timestamps.length; ++i) {
        newTimestamps.push(that.timestamps[i]);
        valueEntries.forEach(([name]) => newValues[name].push(that.values[name][i]));
      }
  
      that.timestamps = newTimestamps;
      that.values = newValues;
    }
  
    adjustStartPoint(timestamp) {
      if (timestamp <= this.timeRange.fromTimestamp) {
        return;
      }
  
      if (timestamp > this.timeRange.toTimestamp) {
        throw new Error(`Cannot set start point to ${timestamp} when end point is ${this.timeRange.toTimestamp}`);
      }
  
      let index = this.timestamps.findIndex(curr => curr >= timestamp);
      if (index < 0) {
        index = this.timestamps.length;
      }
  
      this.timestamps.splice(0, index);
      Object.entries(this.values).forEach(curr => {
        curr[1].splice(0, index);
      });
      this.timeRange.fromTimestamp = timestamp;
    }
  
    adjustEndPoint(timestamp) {
      if (timestamp >= this.timeRange.toTimestamp) {
        return;
      }
  
      if (timestamp < this.timeRange.fromTimestamp) {
        throw new Error(`Cannot set end point to ${timestamp} when start point is ${this.timeRange.fromTimestamp}`);
      }
  
      let index = this.timestamps.findIndex(curr => curr >= timestamp);
      if (index < 0) {
        index = this.timestamps.length;
      }
  
      this.timestamps.splice(index);
      Object.entries(this.values).forEach(curr => {
        curr[1].splice(index);
      });
      this.timeRange.toTimestamp = timestamp;
    }
  
    isOutsideOf(t0, t1) {
      return this.timeRange.isOutsideOf(t0, t1);
    }  
  
    matchesName(name) {
      return this.metricName === name;
    }
  
    toString() {
      return this.timeRange.toString();
    }
  
    static newMono(metricName, timeRange, timestamps = [], valueStream = []) {
      return new TimeSeries(metricName, timeRange, timestamps, {"DEFAULT": valueStream});
    }
  }
  