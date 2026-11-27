// Provider replies of the AMINA Public API captured by the harness recorder.
// Field names, nesting and value types are those of the recorded replies; the
// changed values below are variants of one recorded reply that exercise the
// adapter's handling of a provider field.

export const API_HOST_SANDBOX = 'https://integration-test.aminagroup.io'
export const API_HOST_PRODUCTION = 'https://integration.aminagroup.io'
export const API_HOST_CUSTOM = 'https://sandbox.example.test'

export const AUTH_PATH = '/api/b2c/v1/auth'
export const PORTFOLIO = '157769305'
export const ISIN = 'US0378331005'
export const OTHER_ISIN = 'CH0012032048'
export const POSITIONS_PATH = `/api/b2c/v1/securities/portfolios/${PORTFOLIO}/positions`

export const userId = '12345678'
export const password = 'test-password'
export const hmacSecret = 'test-hmac-secret'
export const agreementNumber = '123456-1'

// The login reply: the provider returns an access token and a refresh token.
export const loginReply = {
  accessToken: 'recorded-access-token',
  refreshToken: 'recorded-refresh-token',
}

// The refresh reply: the provider returns a renewed access token and refresh
// token.
export const refreshReply = {
  accessToken: 'recorded-access-token-renewed',
  refreshToken: 'recorded-refresh-token-renewed',
}

// The same login reply with a different access token, so a second login is
// distinguishable from the first.
export const secondLoginReply = {
  accessToken: 'recorded-access-token-second-login',
  refreshToken: 'recorded-refresh-token-second-login',
}

// A positions page: one position of the configured ISIN whose quantity is the
// share count the adapter publishes.
export const positionsPageZero = {
  positions: [
    {
      isin: ISIN,
      marketValueChf: 28642.7911,
      quantity: 100.0,
      buyingRate: 300.0,
      costPrice: 24741.0,
      performance: 15.770547269714253,
      rate: 341.27,
      instrument: {
        isin: ISIN,
        symbol: 'AAPL',
        type: 2,
        name: 'Registered Shs Apple Inc ',
        shortName: 'Apple Rg',
        exchange: 'NASDAQ',
        price: 341.27,
        currency: 'USD',
      },
      currency: 'USD',
    },
  ],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

// The next positions page: no positions and last true.
export const positionsPageOne = {
  positions: [],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 1,
  first: false,
  last: true,
}

// A second position of another ISIN, shaped like the recorded position.
const otherPosition = {
  isin: OTHER_ISIN,
  marketValueChf: 1250.5,
  quantity: 42.5,
  buyingRate: 100.0,
  costPrice: 1200.0,
  performance: 4.166666666666667,
  rate: 101.5,
  instrument: {
    isin: OTHER_ISIN,
    symbol: 'NESN',
    type: 2,
    name: 'Registered Shs Nestle SA',
    shortName: 'Nestle Rg',
    exchange: 'SIX',
    price: 101.5,
    currency: 'CHF',
  },
  currency: 'CHF',
}

export const positionsPageZeroWithOtherIsin = {
  ...positionsPageZero,
  positions: [positionsPageZero.positions[0], otherPosition],
}

export const positionsPageZeroFirstOfTwo = {
  ...positionsPageZero,
  totalPages: 2,
  last: false,
}

export const positionsPageOneLastOfTwo = {
  ...positionsPageOne,
  totalPages: 2,
}

export const positionsPageOneWithMatch = {
  ...positionsPageOne,
  totalPages: 2,
  positions: [positionsPageZero.positions[0]],
}

export const positionsPageZeroDuplicate = {
  ...positionsPageZero,
  positions: [positionsPageZero.positions[0], positionsPageZero.positions[0]],
}

export const positionsPageZeroMorePagesThanTotalPages = {
  ...positionsPageZero,
  totalPages: 1,
  last: false,
}

export const positionsPageZeroWithoutPositions = {
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const positionsPageZeroLastNotBoolean = {
  ...positionsPageZero,
  last: 'true',
}

export const positionsPageZeroTotalPagesNotInteger = {
  ...positionsPageZero,
  totalPages: 1.5,
}

export const positionsPageZeroFractionalQuantity = {
  ...positionsPageZero,
  positions: [{ ...positionsPageZero.positions[0], quantity: 100.123456789 }],
}

export const positionsPageZeroZeroQuantity = {
  ...positionsPageZero,
  positions: [{ ...positionsPageZero.positions[0], quantity: 0 }],
}

export const positionsPageZeroNegativeQuantity = {
  ...positionsPageZero,
  positions: [{ ...positionsPageZero.positions[0], quantity: -12.5 }],
}

export const positionsPageZeroQuantityNotNumber = {
  ...positionsPageZero,
  positions: [{ ...positionsPageZero.positions[0], quantity: '100.0' }],
}

export const positionsPageZeroQuantityNull = {
  ...positionsPageZero,
  positions: [{ ...positionsPageZero.positions[0], quantity: null }],
}

// The provider's error body for a request whose HMAC signature does not match.
export const hmacSignatureMismatchBody = {
  title: 'HMAC signature mismatch.',
  instance: 'cda9c2c2-4334',
  status: 400,
}
