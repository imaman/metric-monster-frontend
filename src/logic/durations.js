import ms from 'ms'

export const durations = [
  {s: '15m', u: 'minute'},
  {s: '30m', u: 'minute'},
  {s: '1h', u: 'minute'},
  {s: '2h', u: 'minute'},
  {s: '4h', u: 'minute'},
  {s: '6h', u: 'minute'},
  {s: '12h', u: 'hour'},
  {s: '1d', u: 'hour'},
  {s: '2d', u: 'hour'},
  {s: '4d', u: 'day'},
  {s: '1w', u: 'day'},
  {s: '2w', u: 'day'},
  {s: '4w', u: 'day'},
  {s: '8w', u: 'day'},
  {s: '16w', u: 'day'},
  {s: '26w', u: 'day'},
  {s: '52w', u: 'day'}
]


export function findDurationIndex(durationString) {
  const millis = durationStringToMs(durationString);
  let ret = durations.findIndex(curr => ms(curr.s) >= millis);
  if (ret < 0) {
    ret = durations.length - 1;
  }
  return ret;
}


export function durationStringToMs(durationString) {
  return ms(durationString);
}

export function normalizeDurationString(arg) {
  function aux(arg) {
    if (!arg) {
      return '1h';
    }
  
    const millis = ms(arg);
    const days = millis / ms("1d");
    if (days >= 4) {
      return `${Math.trunc(days)}d`;
    }
    const hours = millis / ms("1h");
    if (hours >= 4) {
      return `${Math.trunc(hours)}h`;
    }
  
    const mins = millis / ms("1m");
    return `${Math.trunc(mins)}m`;
  }

  const durationString = aux(arg);

  return {
    durationString,
    unit: durations[findDurationIndex(durationString)].u
  };
}

