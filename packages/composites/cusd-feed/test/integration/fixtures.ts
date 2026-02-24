import nock from 'nock'

// Test constants
export const MOCK_POR_URL = 'http://localhost:8081'
export const MOCK_AUM = '10500000000000000000000000' // 10.5M with 18 decimals
export const MOCK_TOTAL_SUPPLY = BigInt('10000000000000000000000000') // 10M with 18 decimals

// Expected result: 10.5M / 10M = 1.05, scaled by 1e18 = 1050000000000000000
export const EXPECTED_RESULT = '1050000000000000000'
export const EXPECTED_RATIO = '1.05'

// Different AUM values for various test scenarios
export const MOCK_AUM_LOW = '9000000000000000000000000' // 9M - undercollateralized (ratio < 1)
export const MOCK_AUM_HIGH = '15000000000000000000000000' // 15M - highly collateralized (ratio = 1.5)
export const MOCK_AUM_EQUAL = '10000000000000000000000000' // 10M - exactly 1:1 (ratio = 1.0)

/**
 * Mock successful response from proof-of-reserves adapter
 */
export const mockPorResponseSuccess = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(
      200,
      {
        result: MOCK_AUM,
        data: {
          result: MOCK_AUM,
          decimals: 18,
        },
        statusCode: 200,
      },
      ['Content-Type', 'application/json'],
    )

/**
 * Mock proof-of-reserves response with custom AUM value
 */
export const mockPorResponseWithAum = (aum: string): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(
      200,
      {
        result: aum,
        data: {
          result: aum,
          decimals: 18,
        },
        statusCode: 200,
      },
      ['Content-Type', 'application/json'],
    )

/**
 * Mock proof-of-reserves adapter returning 500 error
 */
export const mockPorResponseFailure500 = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(500, { error: 'Internal Server Error' }, ['Content-Type', 'application/json'])

/**
 * Mock proof-of-reserves adapter returning 400 error
 */
export const mockPorResponseFailure400 = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(400, { error: 'Bad Request' }, ['Content-Type', 'application/json'])

/**
 * Mock proof-of-reserves adapter timeout (no response)
 */
export const mockPorResponseTimeout = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .replyWithError({ code: 'ETIMEDOUT', message: 'Connection timed out' })

/**
 * Mock proof-of-reserves adapter returning invalid JSON
 */
export const mockPorResponseInvalidJson = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(200, 'not valid json', ['Content-Type', 'application/json'])

/**
 * Mock proof-of-reserves adapter returning malformed response (missing result field)
 */
export const mockPorResponseMalformed = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(
      200,
      {
        data: {
          decimals: 18,
        },
        statusCode: 200,
      },
      ['Content-Type', 'application/json'],
    )

/**
 * Mock proof-of-reserves adapter returning zero AUM
 */
export const mockPorResponseZeroAum = (): nock.Scope =>
  nock(MOCK_POR_URL, {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', (body) => body.data?.endpoint === 'multiReserves')
    .reply(
      200,
      {
        result: '0',
        data: {
          result: '0',
          decimals: 18,
        },
        statusCode: 200,
      },
      ['Content-Type', 'application/json'],
    )
