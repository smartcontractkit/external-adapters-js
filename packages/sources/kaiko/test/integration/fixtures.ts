import nock from 'nock'

export const mockRateResponseSuccess = (): nock.Scope =>
  nock('https://us.market-api.kaiko.io/v2/data', {
    encodedQueryParams: true,
    reqheaders: {
      'X-Api-Key': 'fake-api-key',
    },
  })
    .get('/trades.v2/spot_exchange_rate/eth/usd')
    .query(() => true)
    .reply(
      200,
      () => ({
        query: {
          page_size: 100,
          start_time: '2021-10-21T20:23:47.224Z',
          interval: '1m',
          sort: 'desc',
          base_asset: 'eth',
          sources: false,
          include_exchanges: ['*'],
          exclude_exchanges: [],
          quote_asset: 'usd',
          data_version: 'v1',
          commodity: 'trades',
          request_time: '2021-10-21T20:53:58.324Z',
          instruments: [
            'bgon:spot:eth-usdt',
            'cbse:spot:eth-usdt',
            'polo:spot:eth-usdt',
            'bnce:spot:eth-usdt',
            'bfnx:spot:eth-usdt',
            'okex:spot:eth-usdt',
            'btrk:spot:eth-usdt',
            'kcon:spot:eth-usdt',
            'cnex:spot:eth-usdt',
            'huob:spot:eth-usdt',
            'btca:spot:eth-usdt',
            'zbcn:spot:eth-usdt',
            'btrx:spot:eth-usdt',
            'cexi:spot:eth-usdt',
            'bfrx:spot:eth-usdt',
            'bnus:spot:eth-usdt',
            'ftxx:spot:eth-usdt',
            'krkn:spot:eth-usdt',
            'btby:spot:eth-usdt',
            'quon:spot:eth-usdt',
            'stmp:spot:eth-usdt',
            'tidx:spot:eth-usdt',
            'okcn:spot:usdt-usd',
            'cbse:spot:usdt-usd',
            'krkn:spot:usdt-usd',
            'bnus:spot:usdt-usd',
            'btrx:spot:usdt-usd',
            'cexi:spot:usdt-usd',
            'stmp:spot:usdt-usd',
          ],
          start_timestamp: 1634847827224,
          end_timestamp: 1634934227224,
          extrapolate_missing_values: false,
        },
        time: '2021-10-21T20:53:58.409Z',
        timestamp: 1634849638409,
        data: [
          { timestamp: 1634849580000, price: null },
          { timestamp: 1634849580000, price: '4097.271668358277' },
          { timestamp: 1634849520000, price: '4099.005559462574' },
          { timestamp: 1634849460000, price: '4095.367165635129' },
          { timestamp: 1634849400000, price: '4087.500764568911' },
          { timestamp: 1634849340000, price: '4083.5471309502577' },
          { timestamp: 1634849280000, price: '4089.359868808383' },
          { timestamp: 1634849220000, price: '4094.119441927113' },
          { timestamp: 1634849160000, price: '4088.7574585919488' },
          { timestamp: 1634849100000, price: '4083.125591184475' },
          { timestamp: 1634849040000, price: '4077.596948531791' },
          { timestamp: 1634848980000, price: '4071.7246787159993' },
          { timestamp: 1634848920000, price: '4068.0877944863005' },
          { timestamp: 1634848860000, price: '4070.50909208873' },
          { timestamp: 1634848800000, price: '4071.1560082366' },
          { timestamp: 1634848740000, price: '4073.784409799778' },
          { timestamp: 1634848680000, price: '4079.420242659957' },
          { timestamp: 1634848620000, price: '4080.7969034691755' },
          { timestamp: 1634848560000, price: '4080.31244415224' },
          { timestamp: 1634848500000, price: '4074.6335973801415' },
          { timestamp: 1634848440000, price: '4074.8220786600195' },
          { timestamp: 1634848380000, price: '4082.4174406034003' },
          { timestamp: 1634848320000, price: '4074.6070830666577' },
          { timestamp: 1634848260000, price: '4063.19505426343' },
          { timestamp: 1634848200000, price: '4066.2014883623206' },
          { timestamp: 1634848140000, price: '4070.1739238403047' },
          { timestamp: 1634848080000, price: '4069.638863924572' },
          { timestamp: 1634848020000, price: '4067.461478742121' },
          { timestamp: 1634847960000, price: '4078.0047845570334' },
          { timestamp: 1634847900000, price: '4090.8167880862' },
          { timestamp: 1634847840000, price: '4088.5455339865875' },
        ],
        result: 'success',
        access: {
          access_range: { start_timestamp: 1609459200000, end_timestamp: 1654041599000 },
          data_range: { start_timestamp: 1609459200000, end_timestamp: 1654041599000 },
        },
      }),
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
    .get('/analytics.v2/realized_volatility')
    .query(() => true)
    .reply(
      200,
      () => ({
        query: {
          start_time: '2022-01-01T11:01:11.111Z',
          end_time: '2022-01-01T11:11:11.111Z',
          parameters_code: 'btc-usd:1d_10m,btc-usd:7d_10m,btc-usd:30d_10m',
          request_time: '2022-01-01T11:11:11.111Z',
          commodity: 'analytics',
          data_version: 'v2',
        },
        data: {
          'btc-usd:1d_10m': {
            pair: 'btc-usd',
            lookback_window: '1d',
            returns_frequency: '10m',
            realized_volatilities: [
              {
                datetime: '2022-01-01T11:10:00.000Z',
                value: 0.5302169,
              },
            ],
          },
          'btc-usd:30d_10m': {
            pair: 'btc-usd',
            lookback_window: '30d',
            returns_frequency: '10m',
            realized_volatilities: [
              {
                datetime: '2022-01-01T11:10:00.000Z',
                value: 0.5291809,
              },
            ],
          },
          'btc-usd:7d_10m': {
            pair: 'btc-usd',
            lookback_window: '7d',
            returns_frequency: '10m',
            realized_volatilities: [
              {
                datetime: '2022-01-01T11:10:00.000Z',
                value: 0.2474815,
              },
            ],
          },
        },
      }),
      ['Content-Type', 'application/json'],
    )
    .persist()
