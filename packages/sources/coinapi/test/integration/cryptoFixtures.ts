import nock from 'nock'

export function mockCryptoEndpoint() {
  nock('https://rest.coinapi.io:443', { encodedQueryParams: true })
    .get('/v1/exchangerate/ETH/BTC')
    .query({ apikey: 'mock-api-key' })
    .reply(
      200,
      {
        time: '2021-10-20T21:34:13.0000000Z',
        asset_id_base: 'ETH',
        asset_id_quote: 'BTC',
        rate: 0.06262119731705901,
        src_side_base: [
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'USD',
            rate: 4130.920428943168,
            volume: 1437597011.9454098,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'CRV',
            rate: 4134.223003575778,
            volume: 114844.02873468095,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'LTC',
            rate: 4132.005563094254,
            volume: 8300406.170517101,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'LINK',
            rate: 4130.201752938671,
            volume: 7634164.440058745,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'COMP',
            rate: 4135.157427532214,
            volume: 21805.121100908087,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'BCH',
            rate: 4133.353696186021,
            volume: 394639.0026662097,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'SOL',
            rate: 4132.5584690711,
            volume: 6339704.149342569,
          },
        ],
        src_side_quote: [
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'BCH',
            rate: 65960.69010238037,
            volume: 14710209.422543585,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'USD',
            rate: 65965.62216035613,
            volume: 2443120210.702457,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'LTC',
            rate: 65983.70034772085,
            volume: 67204310.06307392,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'USDT',
            rate: 65967.02360607093,
            volume: 3697483694.522163,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'LINK',
            rate: 65942.43330622705,
            volume: 37465995.71905391,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'ETH',
            rate: 65967.7896543631,
            volume: 741511928.5841917,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'ZRX',
            rate: 65938.92692127981,
            volume: 1813312.1101375392,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'CRV',
            rate: 65977.836834669,
            volume: 5662319.783619506,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'SOL',
            rate: 65979.34501657759,
            volume: 181906739.5759162,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'MKR',
            rate: 65957.92478239627,
            volume: 3556388.2021378465,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'COMP',
            rate: 65991.46831486505,
            volume: 4030003.0095703383,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'BAT',
            rate: 65991.95159110446,
            volume: 2934758.4841358624,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'STORJ',
            rate: 65984.25842843138,
            volume: 1760596.0831881808,
          },
          {
            time: '2021-10-20T21:34:13.0000000Z',
            asset: 'ENJ',
            rate: 65960.1573448127,
            volume: 3654081.174457365,
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
