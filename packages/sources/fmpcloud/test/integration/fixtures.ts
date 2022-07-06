import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://fmpcloud.io', {
    encodedQueryParams: true,
  })
    .get('/api/v3/quote/AUDUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      () => [
        {
          symbol: 'AUDUSD',
          name: 'AUD/USD',
          price: 0.71222,
          changesPercentage: -1.329799,
          change: -0.009471,
          dayLow: 0.71128,
          dayHigh: 0.71988,
          yearHigh: 0.82076,
          yearLow: 0.71073,
          marketCap: null,
          priceAvg50: 0.73820853,
          priceAvg200: 0.74431854,
          volume: 0,
          avgVolume: 0,
          exchange: 'FOREX',
          open: 0.71903,
          previousClose: 0.71903,
          eps: null,
          pe: null,
          earningsAnnouncement: null,
          sharesOutstanding: null,
          timestamp: 1637945956,
        },
      ],
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
