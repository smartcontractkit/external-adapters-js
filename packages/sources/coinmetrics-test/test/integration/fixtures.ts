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
      page_size: 10000,
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

export const mockCoinmetricsResponseSuccess2 = (pageSize = 1): nock.Scope =>
  nock('https://api.coinmetrics.io/v4')
    .persist()
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: pageSize,
      api_key: 'fake-api-key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-11-04T00:00:00.000000000Z',
          FeeTotNtv: '14465.059425601977193289',
          IssTotNtv: '13175.1875',
          RevNtv: '14887.21684537933981053',
        },
      ],
      next_page_token: '0.MjAyMS0wOC0wNlQwMDowMDowMFo',
    })
