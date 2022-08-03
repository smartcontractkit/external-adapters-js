import nock from 'nock'

export function mockCryptoEndpoint(): nock.Scope {
  return nock('https://rest.coinapi.io:443', { encodedQueryParams: true })
    .get('/v1/exchangerate/BTC')
    .query({ apikey: 'mock-api-key', filter_asset_id: 'EUR' })
    .reply(
      200,
      {
        asset_id_base: 'BTC',
        rates: [
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset_id_quote: 'EUR',
            rate: 22978.232093447674,
          },
        ],
      },
      [
        'date',
        'Wed, 20 Oct 2021 21:34:46 GMT',
        'content-type',
        'application/json; charset=utf-8',
        'transfer-encoding',
        'chunked',
        'x-concurrencylimit-limit',
        '10',
        'x-concurrencylimit-remaining',
        '10',
        'x-ratelimit-used',
        '166181',
        'x-ratelimit-overage',
        'enabled',
        'x-ratelimit-limit',
        '100000',
        'x-ratelimit-remaining',
        '-66181',
        'x-ratelimit-reset',
        '2021-10-21T21:34:47.2685710Z',
        'x-ratelimit-request-cost',
        '1',
        'connection',
        'close',
      ],
    )
}

export function mockAssetEndpoint(): nock.Scope {
  return nock('https://rest.coinapi.io:443', { encodedQueryParams: true })
    .get('/v1/assets')
    .query({ apikey: 'mock-api-key', filter_asset_id: 'ETH' })
    .reply(
      200,
      [
        {
          asset_id: 'ETH',
          name: 'Ethereum',
          type_is_crypto: 1,
          data_quote_start: '2015-08-07T14:50:38.1774950Z',
          data_quote_end: '2022-01-10T18:45:03.3682903Z',
          data_orderbook_start: '2015-08-07T14:50:38.1774950Z',
          data_orderbook_end: '2020-08-05T14:38:33.4327540Z',
          data_trade_start: '2015-08-07T15:21:48.1062520Z',
          data_trade_end: '2022-01-10T18:44:24.5080000Z',
          data_symbols_count: 61012,
          volume_1hrs_usd: 298165681760.79,
          volume_1day_usd: 6964865921209.1,
          volume_1mth_usd: 6100863678584647,
          price_usd: 3043.673871176232,
          id_icon: '604ae453-3d9f-4ad0-9a48-9905cce617c2',
          data_start: '2015-08-07',
          data_end: '2022-01-10',
        },
      ],
      [
        'date',
        'Mon, 10 Jan 2022 19:02:51 GMT',
        'content-type',
        'application/json; charset=utf-8',
        'transfer-encoding',
        'chunked',
        'x-concurrencylimit-limit',
        '10',
        'x-concurrencylimit-remaining',
        '10',
        'x-ratelimit-used',
        '2',
        'x-ratelimit-overage',
        'disabled',
        'x-ratelimit-limit',
        '10000',
        'x-ratelimit-remaining',
        '9998',
        'x-ratelimit-reset',
        '2022-01-11T19:02:51.0913704Z',
        'x-ratelimit-request-cost',
        '1',
        'connection',
        'close',
      ],
    )
}
