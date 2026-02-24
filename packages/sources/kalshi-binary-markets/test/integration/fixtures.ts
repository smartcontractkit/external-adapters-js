import nock from 'nock'

const API_ENDPOINT = 'https://api.kalshi.com/v1'

export const mockMarketResponse = {
  market: {
    can_close_early: true,
    category: 'Macro',
    close_time: '2025-03-19T18:00:00Z',
    event_ticker: 'USIRATECUTS25',
    expiration_time: '2025-03-19T18:00:00Z',
    last_price: 50,
    liquidity: 1000000,
    market_type: 'binary',
    no_ask: 52,
    no_bid: 48,
    open_interest: 104923,
    status: 'active',
    ticker: 'KXUSIRATECUTS25MAR',
    yes_ask: 52,
    yes_bid: 48,
    result: null,
  },
}

export const mockClosedMarketYesResponse = {
  market: {
    can_close_early: false,
    category: 'Politics',
    close_time: '2024-11-05T23:00:00Z',
    event_ticker: 'PRESWIN24',
    expiration_time: '2024-11-05T23:00:00Z',
    last_price: 100,
    liquidity: 0,
    market_type: 'binary',
    no_ask: 0,
    no_bid: 0,
    open_interest: 250000,
    status: 'closed',
    ticker: 'PRESWIN24',
    yes_ask: 100,
    yes_bid: 100,
    result: 'yes',
  },
}

export const mockSettledMarketNoResponse = {
  market: {
    can_close_early: false,
    category: 'Economics',
    close_time: '2024-12-31T23:59:59Z',
    event_ticker: 'GDP2024',
    expiration_time: '2024-12-31T23:59:59Z',
    last_price: 0,
    liquidity: 0,
    market_type: 'binary',
    no_ask: 0,
    no_bid: 0,
    open_interest: 50000,
    status: 'settled',
    ticker: 'GDP2024Q4',
    yes_ask: 0,
    yes_bid: 0,
    result: 'no',
  },
}

export const mockResponseSuccess = (): nock.Scope =>
  nock(API_ENDPOINT)
    .persist()
    .get('/markets/KXUSIRATECUTS25MAR')
    .reply(200, mockMarketResponse)
    .persist()
    .get('/markets/PRESWIN24')
    .reply(200, mockClosedMarketYesResponse)
    .persist()
    .get('/markets/GDP2024Q4')
    .reply(200, mockSettledMarketNoResponse)
    .persist()
    .get('/markets/INVALID_TICKER')
    .reply(404, { error: 'Market not found' })
    .persist()
    .get('/markets/EMPTY_MARKET')
    .reply(200, {})
    .persist()
    .get('/markets/SERVER_ERROR')
    .reply(500, { error: 'Internal Server Error' })
    .persist()
    .get('/markets/UNAUTHORIZED')
    .reply(401, { error: 'Unauthorized' })
