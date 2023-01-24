import nock from 'nock'

export const mockCoinmetricsResponseSuccess = (): nock.Scope =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'BTC',
      metrics: 'ReferenceRateUSD',
      frequency: '1s',
      limit_per_asset: 1,
      api_key: 'fake-api-key',
    })
    .reply(200, {
      data: [
        {
          asset: 'btc',
          time: '2022-03-02T16:52:24.000000000Z',
          ReferenceRateUSD: '2969.5',
        },
      ],
      next_page_token: '0.MjAyMi0wMy0wMlQxNjo1MjoyNFo',
    })
