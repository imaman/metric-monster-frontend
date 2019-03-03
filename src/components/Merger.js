function checkTimeframeEnd(n) {
    if (!Number.isInteger(n)) {
        throw new Error(`Bad timeframe: non-int value (${n})`);
    }
}
function check(timeframe) {
    checkTimeframeEnd(timeframe.fromTimestamp);
    checkTimeframeEnd(timeframe.toTimestamp);

    if (timeframe.toTimestamp < timeframe.fromTimestamp) {
        throw new Error(`Bad timeframe [${timeframe.fromTimestamp}..${timeframe.toTimestamp})`);
    }

    if (timeframe.fromTimestamp < 0) {
        throw new Error(`Bad (negative start point) timeframe: ${formatTimeframe(timeframe)}`);
    }
}

function formatTimeframe(timeframe) {
    return `[${timeframe.fromTimestamp}..${timeframe.toTimestamp})`
}

function checkTimestamps(x) {
    const nonIntIndex = x.timestamps.findIndex(curr => !Number.isInteger(curr));
    if (nonIntIndex >= 0) {
        throw new Error(`Found a non-int timestamp (${x.timestamps[nonIntIndex]})`);
    }

    const index = x.timestamps.findIndex(curr => curr >= x.query.timeframe.toTimestamp || curr < x.query.timeframe.fromTimestamp);
    if (index >= 0) {
        throw new Error(`Found a timestamp (${x.timestamps[index]}) which is out of the ${formatTimeframe(x.query.timeframe)} timeframe`);
    }

    x.timestamps.reduce((x, y) => {
        if (y <= x) { 
            throw new Error(`Found an unsorted list of timestamps. Offending value: ${y}`);
        }
        return y;
    }, -1);
}

function checkValueStreams(x) {
    Object.entries(x.values).find(([name, arr]) => {
        if (arr.length !== x.timestamps.length) {
            throw new Error(`Length of value stream (name=${name}) is ${arr.length} but it should have been ${x.timestamps.length}`);

        }
    });
}

export function merge(a, b) {
    if (!b) {
        return a;
    }

    if (!a) {
        return b;
    }
    if (a.query.metricName !== b.query.metricName) {
        throw new Error(`.metricName mistmatch ("${a.query.metricName}" vs. "${b.query.metricName}")`);
    }

    check(a.query.timeframe);
    check(b.query.timeframe);

    checkTimestamps(a);
    checkValueStreams(a);
    checkTimestamps(b);
    checkValueStreams(b);

    const ret = {
        query: {
            metricName: a.query.metricName,
            timeframe: {
                fromTimestamp: Math.min(a.query.timeframe.fromTimestamp, b.query.timeframe.fromTimestamp),
                toTimestamp: Math.max(a.query.timeframe.toTimestamp, b.query.timeframe.toTimestamp)
            }
        },
        timestamps: [],
        values: {}
    };

    const set = new Set();
    Object.keys(a.values).forEach(k => set.add(k));
    Object.keys(b.values).forEach(k => set.add(k));
    set.forEach(k => ret.values[k] = []);

    let ia = 0;
    let ib = 0;
    while (ia >= 0 && ib >= 0) {
        const aHasMore = ia < a.timestamps.length;
        const bHasMore = ib < b.timestamps.length;
        if (!aHasMore && !bHasMore) {
            break;
        }

        let pickFrom = null;
        if (!aHasMore) {
            pickFrom = b;
        } else if (!bHasMore) {
            pickFrom = a;
        } else {
            const ta = a.timestamps[ia];
            const tb = b.timestamps[ib];

            pickFrom = ta < tb ? a : b;
        }

        if (pickFrom === a) {
            ret.timestamps.push(a.timestamps[ia]);
            set.forEach(k => ret.values[k].push(get(a, ia, k)));
            ++ia;
        } else {
            ret.timestamps.push(b.timestamps[ib]);
            set.forEach(k => ret.values[k].push(get(b, ib, k)));
            ++ib;
        }
    }
    return ret;
}

function get(x, index, valueName) {
    const valueVector = x.values[valueName];
    if (!valueVector) {
        return null;
    }

    return valueVector[index];
}
 
