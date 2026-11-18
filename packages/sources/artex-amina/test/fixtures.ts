// Synthetic AMINA auth and positions replies: the field names, nesting and
// value types of the provider responses, with values that are not from AMINA.
export const API_HOST = 'https://amina.invalid'

export const DATE_HEADER = 'Tue, 10 Mar 2026 00:00:00 GMT'
export const LATER_DATE_HEADER = 'Tue, 10 Mar 2026 00:00:05 GMT'

export const USER_ID = '12345678'
export const PASSWORD = 'test-password'
export const HMAC_SECRET = 'test-hmac-secret'
export const AGREEMENT_NUMBER = 'AGREEMENT-1'

export const MATCHING_ISIN = 'XS0000000001'
export const OTHER_ISIN = 'XS0000000002'

export const ACCESS_TOKEN_1 = 'test-access-token-1'
export const REFRESH_TOKEN_1 = 'test-refresh-token-1'
export const ACCESS_TOKEN_2 = 'test-access-token-2'
export const REFRESH_TOKEN_2 = 'test-refresh-token-2'

export const LOGIN_BODY = {
  accessToken: ACCESS_TOKEN_1,
  refreshToken: REFRESH_TOKEN_1,
}

export const REFRESH_BODY = {
  accessToken: ACCESS_TOKEN_2,
  refreshToken: REFRESH_TOKEN_2,
}

export const AUTH_FAILURE_BODY = {
  title: 'Authentication failed.',
  instance: 'test-instance',
  status: 401,
}

export const POSITIONS_FAILURE_BODY = {
  title: 'Signature verification failed.',
  instance: 'test-instance',
  status: 400,
}

const INSTRUMENT = {
  isin: MATCHING_ISIN,
  symbol: 'TEST',
  type: 2,
  name: 'Test Instrument',
  shortName: 'TEST',
  exchange: 'TESTX',
  price: 99.99,
  currency: 'CHF',
}

const BASE_POSITION = {
  isin: MATCHING_ISIN,
  marketValueChf: 98765.4321,
  quantity: 123.4567,
  buyingRate: 111.11,
  costPrice: 22222.0,
  performance: 1.2345,
  rate: 99.99,
  instrument: INSTRUMENT,
  currency: 'CHF',
}

export const MATCHING_POSITION = BASE_POSITION

export const OTHER_POSITION = {
  ...BASE_POSITION,
  isin: OTHER_ISIN,
  quantity: 42.5,
  instrument: { ...INSTRUMENT, isin: OTHER_ISIN },
}

export const ZERO_POSITION = {
  ...BASE_POSITION,
  quantity: 0,
}

export const NEGATIVE_POSITION = {
  ...BASE_POSITION,
  quantity: -1.25,
}

export const NULL_QUANTITY_POSITION = {
  ...BASE_POSITION,
  quantity: null,
}

export const STRING_QUANTITY_POSITION = {
  ...BASE_POSITION,
  quantity: '123.4567',
}

export const SCALED_POSITION = {
  ...BASE_POSITION,
  quantity: 250.5,
}

export const CONCURRENT_POSITION_100 = {
  ...BASE_POSITION,
  quantity: 100,
}

export const CONCURRENT_POSITION_55 = {
  ...BASE_POSITION,
  quantity: 55,
}

export const ONE_MATCH_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const NO_MATCH_PAGE = {
  positions: [OTHER_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const EMPTY_PAGE = {
  positions: [],
  totalPages: 1,
  totalElements: 0,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const FIRST_OF_TWO_PAGE = {
  positions: [OTHER_POSITION],
  totalPages: 2,
  totalElements: 2,
  size: 20,
  number: 0,
  first: true,
  last: false,
}

export const SECOND_OF_TWO_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 2,
  totalElements: 2,
  size: 20,
  number: 1,
  first: false,
  last: true,
}

export const DUPLICATE_PAGE = {
  positions: [MATCHING_POSITION, MATCHING_POSITION],
  totalPages: 1,
  totalElements: 2,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const DUPLICATE_FIRST_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 2,
  totalElements: 2,
  size: 20,
  number: 0,
  first: true,
  last: false,
}

export const DUPLICATE_SECOND_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 2,
  totalElements: 2,
  size: 20,
  number: 1,
  first: false,
  last: true,
}

export const ZERO_PAGE = {
  positions: [ZERO_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const NEGATIVE_PAGE = {
  positions: [NEGATIVE_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const NULL_QUANTITY_PAGE = {
  positions: [NULL_QUANTITY_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const STRING_QUANTITY_PAGE = {
  positions: [STRING_QUANTITY_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const SCALED_PAGE = {
  positions: [SCALED_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const CONCURRENT_PAGE_100 = {
  positions: [CONCURRENT_POSITION_100],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const CONCURRENT_PAGE_55 = {
  positions: [CONCURRENT_POSITION_55],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const MISSING_POSITIONS_PAGE = {
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const NON_ARRAY_POSITIONS_PAGE = {
  positions: {},
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const BAD_LAST_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: 'true',
}

export const BAD_TOTAL_PAGES_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 1.5,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const MISSING_TOTAL_PAGES_PAGE = {
  positions: [MATCHING_POSITION],
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
}

export const MISSING_LAST_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
}

export const LAST_FALSE_AT_END_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 1,
  totalElements: 1,
  size: 20,
  number: 0,
  first: true,
  last: false,
}

export const LAST_FALSE_ON_LAST_PAGE = {
  positions: [MATCHING_POSITION],
  totalPages: 2,
  totalElements: 2,
  size: 20,
  number: 1,
  first: false,
  last: false,
}
