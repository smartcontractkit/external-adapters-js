export class MockClientReadableStream {
  on = jest.fn((event, handler) => {
    if (event === 'data') {
      handler({
        getBase: jest.fn(() => 'ETH'),
        getAggregatedPriceLst: jest.fn(() => '100.1'),
        getLstQuote: jest.fn(() => 'WETH'),
        getAggregatedPriceUsd: jest.fn(() => '100.2'),
      })
      handler({
        getBase: jest.fn(() => 'RETH'),
        getAggregatedPriceLst: jest.fn(() => '100.3'),
        getLstQuote: jest.fn(() => 'WETH'),
        getAggregatedPriceUsd: jest.fn(() => '100.4'),
      })
      handler({
        getBase: jest.fn(() => 'SOLVBTC'),
        getAggregatedPriceLst: jest.fn(() => '100.5'),
        getLstQuote: jest.fn(() => 'WBTC'),
        getAggregatedPriceUsd: jest.fn(() => '100.6'),
      })
    }
    return this
  })
}
