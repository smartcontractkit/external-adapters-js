import { assert } from 'chai'
import { isPotentialPriceUpdate, priceUpdateNeeded, timestampSecs } from '../src/util';

describe('Utility test', () => {
  it('Check PriceUpdateParams', () => {
    assert.isTrue(isPotentialPriceUpdate({
      forceWrite: true,
      currentPrice: 10,
      thresholdPct: 1,
      idleTime: 100
    }));

    assert.isTrue(isPotentialPriceUpdate({
      forceWrite: false,
      currentPrice: 10,
      thresholdPct: 0,
      idleTime: 100
    }));

    assert.isFalse(isPotentialPriceUpdate({
      forceWrite: false,
      currentPrice: 10,
      thresholdPct: 1,
      idleTime: 10
    }));
  });

  it('Is price update needed', () => {
    const params = {
      forceWrite: false,
      currentPrice: 100,
      thresholdPct: 5,
      idleTime: 10
    };

    // No change in price and price not stale
    assert.isFalse(priceUpdateNeeded(100, {updatedAt: timestampSecs() - 2, answer: 100}, params));

    // Price hasn't changed by threshold
    assert.isFalse(priceUpdateNeeded(100, {updatedAt: timestampSecs() - 8, answer: 96}, params));

    // Price hasn't changed by threshold but price is stale
    assert.isTrue(priceUpdateNeeded(100, {updatedAt: timestampSecs() - 11, answer: 96}, params));

    // Price has changed by threshold but price isn't stale
    assert.isTrue(priceUpdateNeeded(100, {updatedAt: timestampSecs() - 8, answer: 94}, params));
  });
});
