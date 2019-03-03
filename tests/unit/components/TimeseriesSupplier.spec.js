import { expect } from 'chai'
import TimeseriesSupplier from '@/components/TimeseriesSupplier.js'

class CustomTimeseriesSupplier extends TimeseriesSupplier {
  constructor(...args) {
    super(...args);
    this.capturedRequests = [];
    this.responses = [];
    this.responseGenerator = null;
  }

  async callLambda(request) {
    this.capturedRequests.push(request);
    if (this.responseGenerator) {
      return this.responseGenerator(request);
    }
    return this.responses.shift();
  }
}

describe('TimeseriesSupplier', () => {
  describe('spec translation', () => {
    it('moves .polyvalue into .options', async () => {
      const s = new CustomTimeseriesSupplier();
      s.responses.push({output: []});
      await s.getDatapoints({metricName: 'M_1', polyvalue: ['N_7', 'N_8', 'N_9']}, 10, 20);

      const query = s.capturedRequests[0].queries[0];
      expect(query.options).to.eql({polyvalue: ['N_7', 'N_8', 'N_9']});
    });
  });

  xdescribe('core functionality', () => {
    it('relays data from the backend', async () => {
      const s = new CustomTimeseriesSupplier();
      const resp = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_1",
            timeframe: { fromTimestamp: 10, toTimestamp: 20 }
          },
          timestamps: [11, 14, 17],
          values: {DEFAULT: [100, 200, 300]}
        }]
      };
      s.responses.push(resp);
      const r = await s.getDatapoints({metricName: 'M_1'}, 10, 20);
      expect(r).to.eql(resp);

      expect(s.capturedRequests).to.eql([{
        queries: [{
          identifier: "P_0",
          metricName: "M_1",
          // options: {},
          timeframe: {fromTimestamp: 10, toTimestamp: 20}
        }],
      }]);
    });
    it('uses a local copy (w/o sending a request to the backend) if the same data is needed again', async () => {
      const s = new CustomTimeseriesSupplier();
      const resp = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_1",
            timeframe: { fromTimestamp: 10, toTimestamp: 20 }
          },
          timestamps: [11, 14, 17],
          values: {DEFAULT: [100, 200, 300]}
        }]
      };
      s.responses.push(resp);
      const r1 = await s.getDatapoints({metricName: 'M_1'}, 10, 20);
      expect(r1).to.eql(resp);

      expect(s.capturedRequests).to.eql([{
        queries: [{
          identifier: "P_0",
          metricName: "M_1",
          // options: {},
          timeframe: {fromTimestamp: 10, toTimestamp: 20}
        }],
      }]);
      s.capturedRequests = [];

      const r2 = await s.getDatapoints({metricName: 'M_1'}, 10, 20);
      expect(r2).to.eql(resp);
      expect(s.capturedRequests).to.eql([]);
    });
    it('uses part of a local copy if same query is resent but with a different timeframe', async () => {
      const s = new CustomTimeseriesSupplier();
      const resp1 = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_2",
            timeframe: { fromTimestamp: 10, toTimestamp: 20 }
          },
          timestamps: [11, 14, 17, 18],
          values: {DEFAULT: [100, 200, 300, 400]}
        }]
      };
      const resp2 = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_2",
            timeframe: { fromTimestamp: 20, toTimestamp: 24 }
          },
          timestamps: [21, 22, 23],
          values: {DEFAULT: [5001, 5002, 5003]}
        }]
      };
      s.responses.push(resp1);
      s.responses.push(resp2);
      await s.getDatapoints({metricName: 'M_2'}, 10, 20);
      expect(s.capturedRequests[0]).to.eql({
        queries: [{
          identifier: "P_0",
          metricName: "M_2",
          timeframe: {fromTimestamp: 10, toTimestamp: 20}
        }],
      });

      const o = await s.getDatapoints({metricName: 'M_2'}, 15, 24);
      expect(s.capturedRequests[1]).to.eql({
        queries: [{
          identifier: "P_0",
          metricName: "M_2",
          timeframe: {fromTimestamp: 20, toTimestamp: 24}
        }],
      });

      expect(o).to.eql(
        {
          "output": [
            {
              "query": {
                "metricName": "M_2",
                "timeframe": {"fromTimestamp": 15, "toTimestamp": 24}
              },
              "timestamps": [17, 18, 21, 22, 23],
              "values": {
                "DEFAULT": [300, 400, 5001, 5002, 5003]
              }
            }
          ]
        });        
    });
    it('supports polyvalues', async () => {
      const s = new CustomTimeseriesSupplier();
      const resp1 = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_2",
            timeframe: { fromTimestamp: 10, toTimestamp: 20 }
          },
          timestamps: [12, 14, 17],
          values: {
            "N_1": [1201, 1401, 1701],
            "N_2": [1202, 1402, 1702],
          }
        }]
      };
      s.responses.push(resp1);

      await s.getDatapoints({metricName: 'M_2'}, 10, 20);      
      expect(s.capturedRequests[0]).to.eql({
        queries: [{
          identifier: "P_0",
          metricName: "M_2",
          timeframe: {fromTimestamp: 10, toTimestamp: 20}
        }],
      });

      const resp2 = {
        output: [{
          query: {
            identifier: "P_0",
            metricName: "M_2",
            timeframe: { fromTimestamp: 5, toTimestamp: 10 }
          },
          timestamps: [5, 6, 7],
          values: {
            "N_1": [501, 601, 701],
            "N_2": [502, 602, 702],
          }
        }]
      };
      s.responses.push(resp2);
      const o = await s.getDatapoints({metricName: 'M_2'}, 5, 20);
      expect(s.capturedRequests[1]).to.eql({
        queries: [{
          identifier: "P_0",
          metricName: "M_2",
          timeframe: {fromTimestamp: 5, toTimestamp: 10}
        }],
      });

      expect(o).to.eql(
        {
          "output": [
            {
              "query": {
                "metricName": "M_2",
                "timeframe": {"fromTimestamp": 5, "toTimestamp": 20}
              },
              "timestamps": [5, 6, 7, 12, 14, 17],
              "values": {
                "N_1": [501, 601, 701, 1201, 1401, 1701],
                "N_2": [502, 602, 702, 1202, 1402, 1702]
              }
            }
          ]
        });        
    });
  });

  describe('complex scenarios', async () => {
    const s = new CustomTimeseriesSupplier();
    s.responseGenerator = function(req) {
      function computeArr(q) {
        const ret = [];
        for (let i = q.timeframe.fromTimestamp; i < q.timeframe.toTimestamp; i += 1000) {
          ret.push(i);
        }
        return ret;
      }

      const output = req.queries.map(q => ({
        query: q,
        timestamps: computeArr(q),
        values: {
          "DEFAULT": computeArr(q)
        }
      }));

      return {output};
    }

    const frames = [
      {"fromTimestamp":1545837480000,"toTimestamp":1545839280000},
      // \/
      {"fromTimestamp":1545838380000,"toTimestamp":1545839280000},
      // <-
      {"fromTimestamp":1545837930000,"toTimestamp":1545838830000},
      // /\
      {"fromTimestamp":1545837030000,"toTimestamp":1545838830000},
      // /\
      {"fromTimestamp":1545835230000,"toTimestamp":1545838830000},
      // <-
      {"fromTimestamp":1545833430000,"toTimestamp":1545837030000},
      // <-
      {"fromTimestamp":1545831630000,"toTimestamp":1545835230000},
      // <-
      {"fromTimestamp":1545829830000,"toTimestamp":1545833430000},
      // <-
      {"fromTimestamp":1545828030000,"toTimestamp":1545831630000},
      // ->
      {"fromTimestamp":1545829830000,"toTimestamp":1545833430000}];

    const acc = [];
    for (let i = 0; i < frames.length; ++i) {
      const curr = frames[i];
      const resp = await s.getDatapoints({metricName: 'M_1'}, curr.fromTimestamp, curr.toTimestamp);
      acc.push(resp);
    }

    expect(acc).to.eql('_');
  });
})

