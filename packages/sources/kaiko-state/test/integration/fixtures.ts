export class MockClientReadableStream {
  on = jest.fn((event, handler) => {
    if (event === 'data') {
      handler({
        getBase: jest.fn(() => 'ETH'),
        getAggregatedPriceLst: jest.fn(() => '100.1'),
        getLstQuote: jest.fn(() => 'WETH'),
        getAggregatedPriceUsd: jest.fn(() => '100.2'),
      })
    }
    return this
  })
}
