import nock from 'nock'

export const mockPriceSuccess = (): nock.Scope =>
  nock('http://localhost:18081', {
    encodedQueryParams: true,
  })
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'ETH',
      metrics: 'ReferenceRateUSD',
      frequency: '1s',
      api_key: 'test_key',
      page_size: '1',
    })
    .reply(
      200,
      {
        data: [
          { asset: 'eth', time: '2022-11-03T09:31:12.000000000Z', ReferenceRateUSD: '1552.8' },
        ],
        next_page_token: 'abc',
        next_page_url: 'abc',
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

export const mockTotalBurnedSuccess = (): nock.Scope =>
  nock('http://localhost:18081', {
    encodedQueryParams: true,
  })
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv%2CRevNtv%2CIssTotNtv',
      frequency: '1d',
      page_size: '10000',
      api_key: 'test_key',
      start_time: '2021-09-20',
      end_time: '2021-09-25',
    })
    .reply(
      200,
      {
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

export const mockBurnedSuccess = (): nock.Scope =>
  nock('http://localhost:18081', {
    encodedQueryParams: true,
  })
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv%2CRevNtv%2CIssTotNtv',
      frequency: '1d',
      page_size: '1',
      api_key: 'test_key',
    })
    .reply(
      200,
      {
        data: [
          {
            asset: 'eth',
            time: '2022-11-02T00:00:00.000000000Z',
            FeeTotNtv: '2161.966589993882262224',
            IssTotNtv: '0',
            RevNtv: '581.529288070705439454',
          },
        ],
        next_page_token: 'abc',
        next_page_url: 'abc',
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
