import nock from 'nock'

export const mockCoinmetricsResponseError1 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 10_000,
      start_time: '2021-08-05',
      end_time: '2021-08-05',
      api_key: 'test_api_key',
    })
    .reply(500, {})

export const mockCoinmetricsResponseError2 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 1,
      api_key: 'test_api_key',
    })
    .reply(500, {})

export const mockCoinmetricsResponseSuccessMalformed1 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 10_000,
      start_time: '2021-08-05',
      end_time: '2021-08-05',
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: {},
    })

export const mockCoinmetricsResponseSuccessMalformed2 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 10_000,
      start_time: '2021-08-05',
      end_time: '2021-08-05',
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-08-05T00:00:00.000000000Z',
          FeeTotNtv: 'unprocessable',
          IssTotNtv: '13232.9375',
          RevNtv: '16433.128000846204783707',
        },
      ],
    })

export const mockCoinmetricsResponseSuccessMalformed3 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 1,
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-08-05T00:00:00.000000000Z',
          FeeTotNtv: 'unprocessable',
          IssTotNtv: '13232.9375',
          RevNtv: '16433.128000846204783707',
        },
      ],
    })

export const mockCoinmetricsResponseSuccessMalformed4 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 1,
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-08-05T00:00:00.000000000Z',
          FeeTotNtv: 'unprocessable',
          IssTotNtv: '13232.9375',
          RevNtv: '16433.128000846204783707',
        },
      ],
    })

export const mockCoinmetricsResponseSuccess1 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 10_000,
      start_time: '2021-09-20',
      end_time: '2021-09-25',
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-09-20T00:00:00.000000000Z',
          FeeTotNtv: '9331.617399578292365165',
          IssTotNtv: '13465.375',
          RevNtv: '14903.076551063217245019',
        },
        {
          asset: 'eth',
          time: '2021-09-21T00:00:00.000000000Z',
          FeeTotNtv: '10725.893521006011986668',
          IssTotNtv: '13569.625',
          RevNtv: '15125.559184739053811959',
        },
        {
          asset: 'eth',
          time: '2021-09-22T00:00:00.000000000Z',
          FeeTotNtv: '7241.077830167154483706',
          IssTotNtv: '13445.875',
          RevNtv: '14506.07882008361914748',
        },
        {
          asset: 'eth',
          time: '2021-09-23T00:00:00.000000000Z',
          FeeTotNtv: '9503.848309834219302852',
          IssTotNtv: '13372.8125',
          RevNtv: '16274.553315636682282599',
        },
        {
          asset: 'eth',
          time: '2021-09-24T00:00:00.000000000Z',
          FeeTotNtv: '7640.784022848909291801',
          IssTotNtv: '13449.25',
          RevNtv: '14517.956543257905308913',
        },
        {
          asset: 'eth',
          time: '2021-09-25T00:00:00.000000000Z',
          FeeTotNtv: '5019.537962541415576967',
          IssTotNtv: '13721.25',
          RevNtv: '14418.533987808854584078',
        },
      ],
    })

export const mockCoinmetricsResponseSuccess2 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 2,
      start_time: '2021-08-05',
      end_time: '2021-08-07',
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-08-06T00:00:00.000000000Z',
          FeeTotNtv: '1',
          IssTotNtv: '3',
          RevNtv: '2',
        },
        {
          asset: 'eth',
          time: '2021-08-07T00:00:00.000000000Z',
          FeeTotNtv: '2',
          IssTotNtv: '4',
          RevNtv: '3',
        },
      ],
      next_page_token: '0.MjAyMS0wOC0wNlQwMDowMDowMFo',
    })
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 2,
      start_time: '2021-08-05',
      end_time: '2021-08-07',
      api_key: 'test_api_key',
      next_page_token: '0.MjAyMS0wOC0wNlQwMDowMDowMFo',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-08-05T00:00:00.000000000Z',
          FeeTotNtv: '3',
          IssTotNtv: '5',
          RevNtv: '4',
        },
      ],
    })

export const mockCoinmetricsResponseSuccess3 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: 1,
      api_key: 'test_api_key',
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

export const mockCoinmetricsResponseSuccess4 = (): nock =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'ETH',
      metrics: 'ReferenceRateUSD',
      frequency: '1s',
      page_size: 1,
      api_key: 'test_api_key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2022-03-02T16:52:24.000000000Z',
          ReferenceRateUSD: '2969.5',
        },
      ],
      next_page_token: '0.MjAyMi0wMy0wMlQxNjo1MjoyNFo',
    })

export const mockSubscribeResponse = {
  request: 'ethReferenceRateUSD',
  response: [
    {
      time: '2022-03-02T16:44:47.000000000Z',
      asset: 'eth',
      ReferenceRateUSD: '2971.13',
      cm_sequence_id: '2',
    },
  ],
}

export const mockUnsubscribeResponse = {
  request: '',
  response: null,
}
