import { segmentize } from './Sequencer';
import { callLambda } from '../logic/callLambda'
import { settings } from '../settings'

function normalize(spec) {
  if (spec.queries) {
    return spec;
  }

  return {
    queries: [
      spec
    ]
  }
}

class Cache {

  constructor() {
    this.cacheItemsByMetricName = new Map();
  }

  get(metricName) {
    let ret = this.cacheItemsByMetricName.get(metricName);
    if (ret) {
      return ret;
    }

    this.cacheItemsByMetricName.set(metricName, []);
    return [];
  }

  put(/*cachedItem*/) {
    // Currently disabled.
    // this.get(cachedItem.metricName).push(cachedItem);
  }
}

class Plan {
  constructor(index, queries, cachedItems) {
    this.identifier = "P_" + index;
    this.queries = queries;
    this.items = cachedItems;
  }

  toString() {
    return JSON.stringify({queries: this.queries, items: this.items}, null, 2);
  }
}

function createPlan(query, index, cache, fromTimestamp, toTimestamp) {
  const name = query.metricName;
  const items = cache.get(name);
  const tss = items.map(item => item.toTimeSeries());
  const segmentation = segmentize(fromTimestamp, toTimestamp, tss);

  return new Plan(
      index,    
      segmentation.uncovered.map(curr => Object.assign({}, query, {timeframe: curr})),
      segmentation.covered.map(x => x.toData()));
}

export default class TimeseriesSupplier {
  constructor() {
    this.cache = new Cache();
  }

  

  async getDatapoints(spec, fromTimestamp, toTimestamp) {
    const normalizedSpec = normalize(spec);
    const plans = normalizedSpec.queries.map((q, i) => createPlan(q, i, this.cache, fromTimestamp, toTimestamp));
    if (!plans.length) {
      throw new Error('An empty graph');
    }

    const req = this._computeReq(plans);
    const resp = req.queries.length ? await callLambda(settings.lambdaGetDataPoints, req) : {output: []};
    return resp;
  }

  _computeReq(plans) {
    const listOfListOfqueries = plans.map(plan => plan.queries.map(q => transformQuery(q, plan.identifier, q.timeframe.toTimestamp - q.timeframe.fromTimestamp)));
    const ret = {
      queries: [].concat(...listOfListOfqueries)
    };

    return ret;
  }
}


function transformQuery(src, identifier, timeframeInMillis) {
  if (!src) {
    return undefined;
  }

  const ret = {
    metricName: src.metricName,
    timeframe: src.timeframe,
  }

  copyOptions(src, ret, timeframeInMillis);

  if (identifier) {
    ret.identifier = identifier;
  }

  if (src.formula) {
    ret.formula = src.formula;
  }

  const per = transformQuery(src.per, undefined, timeframeInMillis);
  if (per) {
    ret.per = per;
  }
  
  return ret;
}

function copyOptions(src, dst, timeframeInMillis) {
  if (src.minutesPerPoint !== undefined && src.datapointIntervalMillis !== undefined) {
    throw new Error('bad query ' + JSON.stringify(src));
  }
  
  let datapointIntervalMillis = 2 * 60 * 1000;  // 2m
  if (src.minutesPerPoint !== undefined) {
    datapointIntervalMillis = src.minutesPerPoint * 60 * 1000;
  } else if (src.datapointIntervalMillis !== undefined) {
    datapointIntervalMillis = src.datapointIntervalMillis;
  }

  const numDatapoints = timeframeInMillis / datapointIntervalMillis;
  const desiredNumDatapoints = 100;
  if (numDatapoints > desiredNumDatapoints) {
    datapointIntervalMillis = Math.trunc(timeframeInMillis / desiredNumDatapoints);
    console.log(`Downsampled to ${(datapointIntervalMillis / (1000 * 60)).toFixed(3)} minutes per point`);
  }

  const obj = {
    polyvalue: src.polyvalue,
    datapointIntervalMillis
  }

  Object.keys(obj)
    .filter(k => obj[k] === undefined)
    .forEach(k => delete obj[k]);

  if (!Object.keys(obj).length) {
    return;
  }

  dst.options = obj;
}


/*
gdp: {"fromTimestamp":1545837480000,"toTimestamp":1545839280000}
req:[{"fromTimestamp":1545837480000,"toTimestamp":1545839280000}]
\/
gdp: {"fromTimestamp":1545838380000,"toTimestamp":1545839280000}
<-
gdp: {"fromTimestamp":1545837930000,"toTimestamp":1545838830000}
/\
gdp: {"fromTimestamp":1545837030000,"toTimestamp":1545838830000}
req:[{"fromTimestamp":1545837030000,"toTimestamp":1545837480000}]
/\
gdp: {"fromTimestamp":1545835230000,"toTimestamp":1545838830000}
req:[{"fromTimestamp":1545835230000,"toTimestamp":1545837030000}]
<-
gdp: {"fromTimestamp":1545833430000,"toTimestamp":1545837030000}
req:[{"fromTimestamp":1545833430000,"toTimestamp":1545835230000}]
<-
gdp: {"fromTimestamp":1545831630000,"toTimestamp":1545835230000}
req:[{"fromTimestamp":1545831630000,"toTimestamp":1545833430000}]
<-
gdp: {"fromTimestamp":1545829830000,"toTimestamp":1545833430000}
req:[{"fromTimestamp":1545829830000,"toTimestamp":1545833430000}]
<-
gdp: {"fromTimestamp":1545828030000,"toTimestamp":1545831630000}
req:[{"fromTimestamp":1545828030000,"toTimestamp":1545829830000}]
->
gdp: {"fromTimestamp":1545829830000,"toTimestamp":1545833430000}

*/
