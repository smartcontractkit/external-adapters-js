import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://data-engine', {
    encodedQueryParams: true,
  })
    .post('/')
    .reply(200, () => ({
      data: {
        mid: '1',
        lastSeenTimestampNs: '2',
        bid: '3',
        bidVolume: 4,
        ask: '5',
        askVolume: 6,
        lastTradedPrice: '7',
        marketStatus: 1,
        decimals: 1,
      },
      statusCode: 200,
    }))
    .persist()
