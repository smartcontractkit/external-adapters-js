import nock from 'nock'

const API_KEY_QUERY = { apikey: 'fake-api-key' }

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/AAPL')
    .query(API_KEY_QUERY)
    .reply(200, () => ({
      symbol: 'AAPL',
      ask: 26.32,
      bid: 25.8,
      asize: 13,
      bsize: 1,
      timestamp: 1628899200621,
    }))
    .get('/agg/stock/prev-close/ETH')
    .query(API_KEY_QUERY)
    .reply(200, () => ({
      symbol: 'ETH',
      totalResults: 1,
      results: [{ o: 26.79, h: 26.85, l: 26.02, c: 26.3, v: 367009, t: 1628884800000 }],
    }))
    .get('/last/forex/GBPUSD')
    .query(API_KEY_QUERY)
    .reply(200, { symbol: 'GBPUSD', ask: 1.34435, bid: 1.34426, timestamp: 1637060382000 })
    .get('/last/crypto/BTCUSD')
    .query(API_KEY_QUERY)
    .reply(200, { symbol: 'BTCUSD', price: 50940.12, timestamp: 1638898619885 })
    .get('/last/trade/forex/WTIUSD')
    .query(API_KEY_QUERY)
    .reply(200, {
      symbol: 'WTIUSD',
      price: 98.91,
      timestamp: 1659017220,
    })
    .get('/last/etf/IBTA')
    .query({
      country: 'uk',
      ...API_KEY_QUERY,
    })
    .reply(200, {
      symbol: 'IBTA',
      price: 5.276,
      timestamp: 1684403239105,
    })

export const mockResponseFailure = (): nock.Scope =>
  nock('https://api.finage.co.uk', {
    encodedQueryParams: true,
  })
    .get('/last/stock/NON-EXISTING')
    .query(API_KEY_QUERY)
    .reply(400, () => ({ error: 'Please check the symbol and try again.' }))
    .get('/last/trade/forex/NONEXISTINGUSD')
    .query(API_KEY_QUERY)
    .reply(400, () => ({ error: 'Please check the symbol and try again.' }))
    .get('/last/etf/NON_EXISTING_UK_ETF')
    .query({
      country: 'uk',
      ...API_KEY_QUERY,
    })
    .reply(400, () => ({ error: 'Please check the symbol and try again.' }))

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

export const mockUkEtfSubscribeResponse = {
  request: {
    action: 'subscribe',
    symbols: 'IBTA',
  },
  response: [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the market source.',
    },
    {
      s: 'IBTA',
      P: 5.276,
      Dc: '-2.8028',
      Dd: '-11.3000',
      T: 1646157588000,
    },
  ],
}

export const mockUkEtfUnsubscribeResponse = {
  request: {
    action: 'unsubscribe',
    symbols: 'IBTA',
  },
  response: null,
}
