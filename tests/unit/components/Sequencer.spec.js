import { expect } from 'chai'
import { segmentize } from '@/components/Sequencer'
import { TimeRange, TimeSeries } from '@/components/TimeSeries'

describe('sequencer', () => {
  describe('core functionality', () => {
    it('computes uncovered segments', () => {
      const arr = [
        new TimeSeries('', new TimeRange(10, 20)),
        new TimeSeries('', new TimeRange(5, 8)),
        new TimeSeries('', new TimeRange(15, 26)),
        new TimeSeries('', new TimeRange(35, 40)),
        new TimeSeries('', new TimeRange(6, 7)),
        new TimeSeries('', new TimeRange(23, 28))
      ];
    
      const segmentation = segmentize(5, 42, arr);
      expect(segmentation.covered.join(' ')).to.equal('[5..8) [10..28) [35..40)');
      expect(segmentation.uncovered.join(' ')).to.equal('[8..10) [28..35) [40..42)');
    });
  });

  describe('simple cases', () => {
    it('single segment', () => {
      const segmentation = segmentize(0, 10, [
        new TimeSeries('', new TimeRange(4, 6))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[4..6)');
      expect(segmentation.uncovered.join(' ')).to.equal('[0..4) [6..10)');
    });
    it('two non-overlapping segments', () => {
      const segmentation = segmentize(0, 10, [
        new TimeSeries('', new TimeRange(2, 4)),
        new TimeSeries('', new TimeRange(6, 7))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[2..4) [6..7)');
      expect(segmentation.uncovered.join(' ')).to.equal('[0..2) [4..6) [7..10)');
    });
    it('two overlapping segments', () => {
      const segmentation = segmentize(0, 10, [
        new TimeSeries('', new TimeRange(2, 4)),
        new TimeSeries('', new TimeRange(2, 4))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[2..4)');
      expect(segmentation.uncovered.join(' ')).to.equal('[0..2) [4..10)');
    });
    it('two partially overlapping segments', () => {
      const segmentation = segmentize(0, 10, [
        new TimeSeries('', new TimeRange(2, 4)),
        new TimeSeries('', new TimeRange(3, 6))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[2..6)');
      expect(segmentation.uncovered.join(' ')).to.equal('[0..2) [6..10)');
    });
    it('trims if endpoints are inside', () => {
      const segmentation = segmentize(5, 8, [
        TimeSeries.newMono('', new TimeRange(2, 10))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[5..8)');
      expect(segmentation.uncovered.join(' ')).to.equal('');
    });
    it('trims if endpoints are inside with multiple segments', () => {
      const segmentation = segmentize(10, 20, [
        new TimeSeries('', new TimeRange(5, 13)),
        new TimeSeries('', new TimeRange(16, 30))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[10..13) [16..20)');
      expect(segmentation.uncovered.join(' ')).to.equal('[13..16)');
    });
    it('trims multiple segments if endpoints are way inside', () => {
      const segmentation = segmentize(35, 45, [
        new TimeSeries('', new TimeRange(10, 20)),
        new TimeSeries('', new TimeRange(20, 30)),
        new TimeSeries('', new TimeRange(30, 40)),
        new TimeSeries('', new TimeRange(40, 50)),
        new TimeSeries('', new TimeRange(50, 60)),
        new TimeSeries('', new TimeRange(60, 70)),
        new TimeSeries('', new TimeRange(70, 80))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[35..40) [40..45)');
      expect(segmentation.uncovered.join(' ')).to.equal('');
    });
    it('trims multiple segments if endpoints are way inside but fall between segments', () => {
      const segmentation = segmentize(28, 48, [
        new TimeSeries('', new TimeRange(10, 16)),
        new TimeSeries('', new TimeRange(20, 26)),
        new TimeSeries('', new TimeRange(30, 36)),
        new TimeSeries('', new TimeRange(40, 46)),
        new TimeSeries('', new TimeRange(50, 56)),
        new TimeSeries('', new TimeRange(60, 66)),
        new TimeSeries('', new TimeRange(70, 76))
      ]);
      expect(segmentation.covered.join(' ')).to.equal('[30..36) [40..46)');
      expect(segmentation.uncovered.join(' ')).to.equal('[28..30) [36..40) [46..48)');
    });
  });

  describe('time series manipulation', () => {
    it('maintains the original datapoints', () => {
      const segmentation = segmentize(0, 10, [
        TimeSeries.newMono('', new TimeRange(2, 4), [2, 3], ['v2', 'v3']),
        TimeSeries.newMono('', new TimeRange(6, 7), [6], ['v6'])
      ]);
      expect(segmentation.covered[0].values["DEFAULT"]).to.eql(['v2', 'v3']);
      expect(segmentation.covered[1].values["DEFAULT"]).to.eql(['v6']);
    });
    it('consolidates two timeseries by copying datapoints over', () => {
      const segmentation = segmentize(0, 10, [
        TimeSeries.newMono('', new TimeRange(2, 5), [2, 3, 4], ['v2', 'v3', 'v4']),
        TimeSeries.newMono('', new TimeRange(4, 7), [4, 5, 6], ['v4', 'v5', 'v6'])
      ]);
      expect(segmentation.covered[0].values["DEFAULT"]).to.eql(['v2', 'v3', 'v4', 'v5', 'v6']);
    });
    it('drops datapoints from both sides', () => {
      const segmentation = segmentize(6, 14, [
        TimeSeries.newMono('', new TimeRange(2, 8), [2, 3, 4, 5, 6, 7], ['v2', 'v3', 'v4', 'v5', 'v6', 'v7']),
        TimeSeries.newMono('', new TimeRange(10, 16), [10, 11, 12, 13, 14, 15], ['v10', 'v11', 'v12', 'v13', 'v14', 'v15'])
      ]);
      expect(segmentation.covered[0].values.DEFAULT).to.eql(['v6', 'v7']);
      expect(segmentation.covered[1].values.DEFAULT).to.eql(['v10', 'v11', 'v12', 'v13']);
    });
  });
})

