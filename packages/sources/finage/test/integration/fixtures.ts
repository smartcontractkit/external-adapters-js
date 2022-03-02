import nock from 'nock'

export const mockResponseSuccess = (): nock =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/AAPL')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      (_, request) => ({
        symbol: 'AAPL',
        ask: 26.32,
        bid: 25.8,
        asize: 13,
        bsize: 1,
        timestamp: 1628899200621,
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
    .get('/agg/stock/prev-close/ETH')
    .query({ apikey: 'fake-api-key' })
    .reply(
      200,
      (_, request) => ({
        symbol: 'ETH',
        totalResults: 1,
        results: [{ o: 26.79, h: 26.85, l: 26.02, c: 26.3, v: 367009, t: 1628884800000 }],
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
    .get('/last/forex/GBPUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'GBPUSD', ask: 1.34435, bid: 1.34426, timestamp: 1637060382000 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])
    .get('/last/crypto/BTCUSD')
    .query({ apikey: 'fake-api-key' })
    .reply(200, { symbol: 'BTCUSD', price: 50940.12, timestamp: 1638898619885 }, [
      'Content-Type',
      'application/json; charset=utf-8',
      'Content-Length',
      '73',
      'Connection',
      'close',
    ])

export const mockResponseFailure = (): nock =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/NON-EXISTING')
    .query({ apikey: 'fake-api-key' })
    .reply(400, (_, request) => ({ error: 'Please check the symbol and try again.' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])

export const mockCryptoSubscribeResponse = {
  request: {
    action: 'subscribe',
    symbols: 'BTCUSD',
  },
  response: [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the Cryptocurrency Market source.',
    },
    {
      s: 'BTCUSD',
      p: '43682.66306523',
      q: '0.04582000',
      dex: false,
      src: 'A',
      t: 1646151298290,
    },
  ],
}

export const mockCryptoUnsubscribeResponse = {
  request: {
    action: 'unsubscribe',
    symbols: 'BTCUSD',
  },
  response: null,
}

export const mockStockSubscribeResponse = {
  request: {
    action: 'subscribe',
    symbols: 'AAPL',
  },

  response: [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the U.S Market source.',
    },
    {
      s: 'AAPL',
      p: 163.58,
      c: [37],
      v: 50,
      dp: false,
      t: 1646154954689,
    },
  ],
}

export const mockStockUnsubscribeResponse = {
  request: {
    action: 'unsubscribe',
    symbols: 'AAPL',
  },
  response: null,
}

export const mockForexSubscribeResponse = {
  request: {
    action: 'subscribe',
    symbols: 'GBP/USD',
  },

  response: [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the Forex Market source.',
    },
    {
      s: 'GBP/USD',
      a: 1.33139,
      b: 1.3313,
      dd: '-0.0108',
      dc: '-0.8082',
      ppms: false,
      t: 1646157588000,
    },
  ],
}

export const mockForexUnsubscribeResponse = {
  request: {
    action: 'unsubscribe',
    symbols: 'GBP/USD',
  },

  response: null,
}
