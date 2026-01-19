import nock from 'nock'

const API_ENDPOINT = 'https://api.kalshi.com/v1'

// Active market without result (not settled)
export const mockMarketResponse = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/KXUSIRATECUTS25MAR')
    .reply(
      200,
      () => ({
        market: {
          ticker: 'KXUSIRATECUTS25MAR',
          event_ticker: 'USIRATECUTS25',
          status: 'active',
          yes_bid: 48,
          yes_ask: 52,
          no_bid: 48,
          no_ask: 52,
          open_interest: 104923,
          category: 'Macro',
          close_time: '2025-03-19T18:00:00Z',
          updated_at: '2025-01-29T00:57:00Z',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// Closed market (not yet settled)
export const mockMarketResponseClosed = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/CLOSEDMARKET')
    .reply(
      200,
      () => ({
        market: {
          ticker: 'CLOSEDMARKET',
          event_ticker: 'CLOSEDEVENT',
          status: 'closed',
          yes_bid: 45,
          yes_ask: 55,
          no_bid: 45,
          no_ask: 55,
          open_interest: 50000,
          category: 'Politics',
          close_time: '2025-01-15T18:00:00Z',
          updated_at: '2025-01-15T18:00:00Z',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// Settled market with "yes" result
export const mockMarketResponseSettledYes = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/SETTLEDYESMARKET')
    .reply(
      200,
      () => ({
        market: {
          ticker: 'SETTLEDYESMARKET',
          event_ticker: 'SETTLEDEVENT',
          status: 'settled',
          result: 'yes',
          yes_bid: 100,
          yes_ask: 100,
          no_bid: 0,
          no_ask: 0,
          open_interest: 75000,
          category: 'Economics',
          close_time: '2025-01-10T18:00:00Z',
          updated_at: '2025-01-10T18:05:00Z',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// Settled market with "no" result
export const mockMarketResponseSettledNo = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/SETTLEDNOMARKET')
    .reply(
      200,
      () => ({
        market: {
          ticker: 'SETTLEDNOMARKET',
          event_ticker: 'SETTLEDEVENT2',
          status: 'settled',
          result: 'no',
          yes_bid: 0,
          yes_ask: 0,
          no_bid: 100,
          no_ask: 100,
          open_interest: 60000,
          category: 'Climate',
          close_time: '2025-01-05T18:00:00Z',
          updated_at: '2025-01-05T18:10:00Z',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// Market with unknown status (edge case)
export const mockMarketResponseUnknownStatus = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/UNKNOWNSTATUSMARKET')
    .reply(
      200,
      () => ({
        market: {
          ticker: 'UNKNOWNSTATUSMARKET',
          event_ticker: 'UNKNOWNEVENT',
          status: 'unknown_status',
          yes_bid: 50,
          yes_ask: 50,
          no_bid: 50,
          no_ask: 50,
          open_interest: 10000,
          category: 'Other',
          close_time: '2025-06-01T18:00:00Z',
          updated_at: '2025-01-20T12:00:00Z',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// Empty response (no market data)
export const mockMarketResponseEmpty = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/EMPTYMARKET')
    .reply(200, () => ({}), ['Content-Type', 'application/json', 'Connection', 'close'])

// Response with null market
export const mockMarketResponseNullMarket = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/NULLMARKET')
    .reply(200, () => ({ market: null }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
    ])

// 404 Not Found
export const mockMarketResponseNotFound = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/NOTFOUNDMARKET')
    .reply(
      404,
      () => ({
        error: {
          code: 'not_found',
          message: 'Market not found',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// 401 Unauthorized
export const mockMarketResponseUnauthorized = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/UNAUTHORIZEDMARKET')
    .reply(
      401,
      () => ({
        error: {
          code: 'unauthorized',
          message: 'Invalid API key',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// 500 Internal Server Error
export const mockMarketResponseServerError = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/SERVERERRORMARKET')
    .reply(
      500,
      () => ({
        error: {
          code: 'internal_error',
          message: 'Internal server error',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// 429 Rate Limited
export const mockMarketResponseRateLimited = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/RATELIMITEDMARKET')
    .reply(
      429,
      () => ({
        error: {
          code: 'rate_limited',
          message: 'Too many requests',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

// 503 Service Unavailable
export const mockMarketResponseServiceUnavailable = (): nock.Scope =>
  nock(API_ENDPOINT, {
    encodedQueryParams: true,
  })
    .persist()
    .get('/markets/UNAVAILABLEMARKET')
    .reply(
      503,
      () => ({
        error: {
          code: 'service_unavailable',
          message: 'Service temporarily unavailable',
        },
      }),
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
