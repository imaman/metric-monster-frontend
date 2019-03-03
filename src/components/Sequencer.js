import {TimeRange} from './TimeSeries'

class RangePoint {
  constructor(timeSeries, isStart) {
    this.timeSeries = timeSeries;
    this.isStart = isStart;
  }

  val() {
    const range = this.timeSeries.timeRange;
    return this.isStart ? range.fromTimestamp : range.toTimestamp;
  }

  toString() {
    return this.isStart ? '<' + this.timeSeries.toString() : this.timeSeries.toString() + '>';
  }
}


// Assumes that dstTimeSeries ends after srcTimeSeries
// (formally: dstTimeSeries.timeRange.toTimestamp >= srcTimeSeries.timeRange.toTimestamp)
function copyPrefix(srcTimeSeries, dstTimeSeries) {
  const srcFrom = srcTimeSeries.timeRange.fromTimestamp;
  const dstFrom = dstTimeSeries.timeRange.fromTimestamp;
  if (dstFrom <= srcFrom) {
    return;
  }

  srcTimeSeries.copyInto(dstTimeSeries, srcFrom, dstFrom);
  dstTimeSeries.timeRange.fromTimestamp = srcFrom;
  // const arr = [];
  // dstTimeSeries.getDatapoints()
  // return arr;
}

function consolidate(rangePointA, rangePointB) {
  if (!rangePointA) {
    return rangePointB;
  }
  if (!rangePointB) {
    return rangePointA;
  }

  const trA = rangePointA.timeSeries.timeRange;
  const trB = rangePointB.timeSeries.timeRange;
  if (trA.toTimestamp > trB.toTimestamp) {
    copyPrefix(rangePointB.timeSeries, rangePointA.timeSeries);
    return rangePointA;
  }

  copyPrefix(rangePointA.timeSeries, rangePointB.timeSeries);
  // trB.fromTimestamp = Math.min(trA.fromTimestamp, trB.fromTimestamp);
  return rangePointB;
}

export function computeSegments(listOftimeSeries, t0, t1) {
  if (t0 > t1) {
    throw new Error(`Bad timerange [${t0}..${t1})`);
  }
  const filtered = listOftimeSeries.filter(curr => !curr.isOutsideOf(t0, t1));
  
  const arr = [];
  filtered.forEach(curr => {
    arr.push(new RangePoint(curr, true));
    arr.push(new RangePoint(curr, false));
  });

  arr.sort((lhs, rhs) => lhs.val() - rhs.val());


  const output = [];

  let active = null;
  for (let i = 0; i < arr.length; ++i) {
    const curr = arr[i];
    if (curr.isStart) {
      active = consolidate(active, curr);
      continue;
    } 

    if (curr.timeSeries !== active.timeSeries) {
      continue;
    } 

    output.push(curr.timeSeries);
    active = null;
  }

  return output;
}

export function computeMissing(t0, t1, segments) {
  const ret = [];
  for (let i = 0; i <= segments.length; ++i) {
    const curr = i < segments.length ? segments[i].timeRange.fromTimestamp : t1;
    const prevTimestamp = i > 0 ? segments[i -1].timeRange.toTimestamp : t0;
    ret.push(new TimeRange(prevTimestamp, curr));
  }
  return ret.filter(curr => !curr.isEmpty());
}

export function segmentize(t0, t1, listOftimeSeries) {
  if (t0 > t1) {
    throw new Error(`Illegal timeframe: ${t0}..${t1}`);
  }
  const covered = computeSegments(listOftimeSeries, t0, t1);
  if (covered.length) {
    covered[0].adjustStartPoint(t0);
    covered[covered.length - 1].adjustEndPoint(t1);
  }
  const uncovered = computeMissing(t0, t1, covered);
  return {covered, uncovered}
}

