import nock from 'nock'

export const mockCoinmetricsResponseSuccess = (): nock =>
  nock('https://api.coinmetrics.io:443', { encodedQueryParams: true })
    .get('/v4/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv%2CRevNtv%2CIssTotNtv',
      frequency: '1d',
      api_key: 'test_key',
      page_size: '1',
    })
    .reply(
      200,
      {
        data: [
          {
            asset: 'eth',
            time: '2021-09-14T00:00:00.000000000Z',
            FeeTotNtv: '8678.054136625938276296',
            IssTotNtv: '13446.375',
            RevNtv: '15542.571011111157438326',
          },
        ],
        next_page_token: '0.MjAyMS0wOS0xNFQwMDowMDowMFo',
        next_page_url:
          'https://api.coinmetrics.io/v4/timeseries/asset-metrics?assets=eth&metrics=FeeTotNtv,RevNtv,IssTotNtv&frequency=1d&api_key=test_key&page_size=1&next_page_token=0.MjAyMS0wOS0xNFQwMDowMDowMFo',
      },
      [
        'Date',
        'Wed, 15 Sep 2021 09:32:57 GMT',
        'Content-Type',
        'application/json',
        'Content-Length',
        '433',
        'Connection',
        'close',
        'access-control-allow-origin',
        '*',
        'x-ratelimit-limit',
        '6000, 6000;w=20;comment="sliding window"',
        'x-ratelimit-remaining',
        '5844',
        'x-ratelimit-reset',
        '20',
        'Expires',
        'Wed, 15 Sep 2021 09:32:56 GMT',
        'Cache-Control',
        'no-cache',
        'CF-Cache-Status',
        'DYNAMIC',
        'Expect-CT',
        'max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"',
        'Report-To',
        '{"endpoints":[{"url":"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=JlcudPh5eV4lck4PkxL8S487JG9irMwhBgaeeK0D7ECAcEF2QgfbsHgUw4fH6YlWnxszAWTPbts4I%2FDJnvNd2jsSmyAO%2F38gRl5uy9AElN2n7PTA0fhYXarTss76qUXn1XT86g%3D%3D"}],"group":"cf-nel","max_age":604800}',
        'NEL',
        '{"success_fraction":0,"report_to":"cf-nel","max_age":604800}',
        'Server',
        'cloudflare',
        'CF-RAY',
        '68f0d9ca3cd6fac4-OSL',
        'alt-svc',
        'h3=":443"; ma=86400, h3-29=":443"; ma=86400, h3-28=":443"; ma=86400, h3-27=":443"; ma=86400',
      ],
    )
