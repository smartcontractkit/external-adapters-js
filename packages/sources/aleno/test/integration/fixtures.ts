import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://state-price.aleno.ai', {
    encodedQueryParams: true,
    reqheaders: {
      'x-api-key': 'fake-api-key',
    },
  })
    .get('/baseTokenStates/latest')
    .reply(
      200,
      () => [
        {
          id: 'FRAX/USD',
          baseSymbol: 'FRAX',
          quoteSymbol: 'USD',
          processTimestamp: 1732555634,
          processBlockChainId: 'arbitrum',
          processBlockNumber: 278231251,
          processBlockTimestamp: 1732555633,
          aggregatedLast7DaysBaseVolume: 46661677.60698884,
          price: 0.9950774676498447,
          aggregatedMarketDepthMinusOnePercentUsdAmount: 3924545.4672679068,
          aggregatedMarketDepthPlusOnePercentUsdAmount: 37133041.95023558,
          aggregatedMarketDepthUsdAmount: 41057587.41750349,
          aggregatedLast7DaysUsdVolume: 92915562.18873177,
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
    .persist()
