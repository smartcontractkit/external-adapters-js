import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.coinlore.net/api', {
    encodedQueryParams: true,
  })
    .get('/global')
    .reply(
      200,
      () => [
        {
          coins_count: 6441,
          active_markets: 17685,
          total_mcap: 2499568847643.1787,
          total_volume: 172809052616.55072,
          btc_d: '43.86',
          eth_d: '19.25',
          mcap_change: '-4.25',
          volume_change: '8.44',
          avg_change_percent: '-0.90',
          volume_ath: 3992741953593.4854,
          mcap_ath: 2912593726674.3335,
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
