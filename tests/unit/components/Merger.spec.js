import { expect } from 'chai'
import { merge } from '../../../src/components/Merger'

describe('merger', () => {
  describe('legal inputs', () => {
    it('metric names must match', () => {
      const a = {
        "query": {
            "metricName": "M_A",
            "timeframe": {
              "fromTimestamp": 20,
              "toTimestamp": 24
            }
          },
          "timestamps": [],
          "values": {
            "DEFAULT": []
          }    
      };

      const b = {
        "query": {
          "metricName": "M_B",
          "timeframe": {
            "fromTimestamp": 15,
            "toTimestamp": 20
          }
        },
        "timestamps": [],
        "values": {
          "DEFAULT": []
        }
      };

      expect(() => merge(a, b)).to.throw('.metricName mistmatch ("M_A" vs. "M_B")');
    });
    it('timeframes must have a non-negative duration', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 20, "toTimestamp": 19 }
          },
          "timestamps": [],
          "values": {}
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 15, "toTimestamp": 20 }
        },
        "timestamps": [],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Bad timeframe [20..19)');

      a.query.timeframe.toTimestamp = 21;
      b.query.timeframe.toTimestamp = 14;
      expect(() => merge(a, b)).to.throw('Bad timeframe [15..14)');
    });
    it('timeframes cannot have a negative start point', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": -1, "toTimestamp": 19 }
          },
          "timestamps": [],
          "values": {}
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 15, "toTimestamp": 20 }
        },
        "timestamps": [],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Bad (negative start point) timeframe: [-1..19)');

      a.query.timeframe.fromTimestamp = 0;
      b.query.timeframe.fromTimestamp = -2;
      expect(() => merge(a, b)).to.throw('Bad (negative start point) timeframe: [-2..20)');
    });
    it('timestamps must be inside the timeframe', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 100, "toTimestamp": 110 }
          },
          "timestamps": [100, 109, 110, 120],
          "values": {}
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 15, "toTimestamp": 20 }
        },
        "timestamps": [14, 15, 16],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Found a timestamp (110) which is out of the [100..110) timeframe');
      a.timestamps = [100, 109];

      expect(() => merge(a, b)).to.throw('Found a timestamp (14) which is out of the [15..20) timeframe');
    });
    it('timestamps must be sorted', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 100, "toTimestamp": 110 }
          },
          "timestamps": [105, 102, 109],
          "values": {}
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 15, "toTimestamp": 20 }
        },
        "timestamps": [15, 16],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Found an unsorted list of timestamps. Offending value: 102');
    });
    it('timestamps must be unique (no dups)', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 100, "toTimestamp": 110 }
          },
          "timestamps": [105, 106, 109],
          "values": {}
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 10, "toTimestamp": 20 }
        },
        "timestamps": [12, 14, 16, 16, 18],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Found an unsorted list of timestamps. Offending value: 16');
    });
    it('all valuestreams must have the same length as the timestamps', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 100, "toTimestamp": 110 }
          },
          "timestamps": [105, 108, 109],
          "values": {
            "N_1": [1, 1, 1],
            "N_2": [3, 4, 5],
            "N_3": [3, 4, 5, 19],
          }
      };

      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 15, "toTimestamp": 20 }
        },
        "timestamps": [15, 16],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Length of value stream (name=N_3) is 4 but it should have been 3');

      a.timestamps = [102, 104];
      expect(() => merge(b, a)).to.throw('Length of value stream (name=N_1) is 3 but it should have been 2');
    });
    it('timeframe values must be ints', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 14.2, "toTimestamp": 15 }
        },
        "timestamps": [],
        "values": {}
      };
      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 100, "toTimestamp": 110 }
        },
        "timestamps": [],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Bad timeframe: non-int value (14.2)');

      a.query.timeframe.fromTimestamp = 14;
      a.query.timeframe.toTimestamp = 15.3;
      expect(() => merge(a, b)).to.throw('Bad timeframe: non-int value (15.3)');
    });
    it('timestamp values must be ints', () => {
      const a = {
        "query": {
            "metricName": "M_3",
            "timeframe": { "fromTimestamp": 10, "toTimestamp": 20 }
        },
        "timestamps": [],
        "values": {}
      };
      const b = {
        "query": {
          "metricName": "M_3",
          "timeframe": { "fromTimestamp": 10, "toTimestamp": 20 }
        },
        "timestamps": [12, 13.6, 14],
        "values": {}
      };

      expect(() => merge(a, b)).to.throw('Found a non-int timestamp (13.6)');
    });
  })
  describe('core functionality', () => {
    it('merges a single response item with a single plan', () => {
      const a = {
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 20,
              "toTimestamp": 24
            }
          },
          "timestamps": [21, 22, 23],
          "values": {
            "DEFAULT": [5001, 5002, 5003]
          }    
      };

      const b = {
        "query": {
          "metricName": "M_2",
          "timeframe": {
            "fromTimestamp": 15,
            "toTimestamp": 20
          }
        },
        "timestamps": [17, 18],
        "values": {
          "DEFAULT": [300, 400]
        }
      };

      const ab = merge(a, b);
      expect(ab).to.eql({
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 15,
              "toTimestamp": 24
            }
          },
          "timestamps": [17, 18, 21, 22, 23],
          "values": {
            "DEFAULT": [300, 400, 5001, 5002, 5003]
          }
        });
    });
    it('merges polyvalues', () => {
      const a = {
        "query": {
            "metricName": "M_2",
            "timeframe": {"fromTimestamp": 100, "toTimestamp": 200}
          },
          "timestamps": [120, 140],
          "values": {
            "N_1": [501, 502],
            "N_2": [601, 602]
          }
      };

      const b = {
        "query": {
          "metricName": "M_2",
          "timeframe": {"fromTimestamp": 200, "toTimestamp": 300}
        },
        "timestamps": [230, 260, 290],
        "values": {
          "N_1": [5001, 5002, 5003],
          "N_2": [6001, 6002, 6003]
        }    
    };

      const ab = merge(a, b);
      expect(ab).to.eql({
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 100,
              "toTimestamp": 300
            }
          },
          "timestamps": [120, 140, 230, 260, 290],
          "values": {
            "N_1": [501, 502, 5001, 5002, 5003],
            "N_2": [601, 602, 6001, 6002, 6003]
          }
        });
    });
    it('supports polyvalues with completely distinct value names', () => {
      const a = {
        "query": {
            "metricName": "M_2",
            "timeframe": {"fromTimestamp": 20, "toTimestamp": 24}
          },
          "timestamps": [21, 22, 23],
          "values": {
            "N_1": [5001, 5002, 5003],
            "N_2": [6001, 6002, 6003]
          }    
      };

      const b = {
        "query": {
          "metricName": "M_2",
          "timeframe": {"fromTimestamp": 15, "toTimestamp": 20}
        },
        "timestamps": [17, 18],
        "values": {
          "N_3": [300, 400]
        }
      };

      const ab = merge(a, b);
      expect(ab).to.eql({
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 15,
              "toTimestamp": 24
            }
          },
          "timestamps": [17, 18, 21, 22, 23],
          "values": {
            "N_3": [300, 400, null, null, null],
            "N_1": [null, null, 5001, 5002, 5003],
            "N_2": [null, null, 6001, 6002, 6003]
          }
        });
    });
    it('merging two empty inputs produces an empty output', () => {
      const a = {
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 20,
              "toTimestamp": 24
            }
          },
          "timestamps": [],
          "values": {
            "DEFAULT": []
          }    
      };

      const b = {
        "query": {
          "metricName": "M_2",
          "timeframe": {
            "fromTimestamp": 15,
            "toTimestamp": 20
          }
        },
        "timestamps": [],
        "values": {
          "DEFAULT": []
        }
      };

      const ab = merge(a, b);
      expect(ab).to.eql({
        "query": {
            "metricName": "M_2",
            "timeframe": {
              "fromTimestamp": 15,
              "toTimestamp": 24
            }
          },
          "timestamps": [],
          "values": {
            "DEFAULT": []
          }
        });
    });
  });
});

