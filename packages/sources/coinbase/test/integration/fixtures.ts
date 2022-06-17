import nock from 'nock'

export const mockRateResponseSuccess = (): nock =>
  nock('https://api.coinbase.com')
    .get('/v2/prices/BTC-USD/spot')
    .query({ symbol: 'BTC', convert: 'USD' })
    .reply(200, (_, request) => ({ data: { base: 'BTC', currency: 'USD', amount: '57854.29' } }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

export const mockNftResponseSuccess = (): nock =>
  nock('http://fake-nft.endpoint')
    .get('/api/nft/v1/GetFloorPriceEstimate')
    .query({
      networkName: 'ethereum-mainnet',
      contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      startDay: '2022-05-25T12:00:00.000Z',
      endDay: '2022-05-25T12:00:00.000Z',
    })
    .reply(
      200,
      {
        floorPriceDailyValue: [
          {
            date: '2022-05-11T00:00:00Z',
            multiplier: 1,
            priceStdDev: 0.12498363928979012,
            logFloorPrice: 4.569591987976991,
            adjustedFloorPrice: 85.16651572690085,
          },
        ],
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
