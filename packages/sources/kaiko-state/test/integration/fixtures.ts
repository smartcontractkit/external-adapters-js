export class MockClientReadableStream {
  on = jest.fn((event, handler) => {
    if (event === 'data') {
      handler({
        getBase: jest.fn(() => 'ETH'),
        getAggregatedPriceEth: jest.fn(() => '100.1'),
        getAggregatedPriceUsd: jest.fn(() => '100.2'),
      })
    }
    return this
  })
}
