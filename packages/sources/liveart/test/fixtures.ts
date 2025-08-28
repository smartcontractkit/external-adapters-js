import nock from 'nock'
import { TEST_BEARER_TOKEN, TEST_URL } from './config'

export const mockHappyPathResponseSuccess = (artworkId: string): nock.Scope =>
  nock(TEST_URL, {
    encodedQueryParams: true,
  })
    .get(`/artwork/${artworkId}/price`)
    .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
    .query({})
    .reply(
      200,
      () => ({
        artwork_id: `${artworkId}`,
        current_estimated_price_updated_at: '2025-08-28T14:27:11.345Z',
        current_estimated_price: '10000',
        total_shares: 0,
        nav_per_share: '10000',
        valuation_price_date: '2025-08-28',
        valuation_price: '10',
        valuation_method: 'string',
        success: true,
        message: 'string',
        response_timestamp: '2025-08-28T14:27:11.345Z',
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
    .persist()

// export const mockValue0ResponseSuccess = (artworkId: string): nock.Scope =>
//   nock(TEST_URL, {
//     encodedQueryParams: true,
//   })
//     .get(`/artwork/${artworkId}/price`)
//     .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
//     .query({})
//     .reply(200, () => ({}), [
//       'Content-Type',
//       'application/json',
//       'Connection',
//       'close',
//       'Vary',
//       'Accept-Encoding',
//       'Vary',
//       'Origin',
//     ])
//     .persist()

// export const mockResponseFailure = (artworkId: string): nock.Scope =>
//   nock(TEST_URL, {
//     encodedQueryParams: true,
//   })
//     .get(`/artwork/${artworkId}/price`)
//     .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
//     .query({})
//     .reply(200, () => ({ integration: 'missing-value-integration', timestamp_ms: 1746214393080 }), [
//       'Content-Type',
//       'application/json',
//       'Connection',
//       'close',
//       'Vary',
//       'Accept-Encoding',
//       'Vary',
//       'Origin',
//     ])
//     .persist()

// export const mockErrorResponseFailure = (artworkId: string): nock.Scope =>
//   nock(TEST_URL, {
//     encodedQueryParams: true,
//   })
//     .get(`/artwork/${artworkId}/price`)
//     .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
//     .query({})
//     .reply(403, () => ({}), [
//       'Content-Type',
//       'application/json',
//       'Connection',
//       'close',
//       'Vary',
//       'Accept-Encoding',
//       'Vary',
//       'Origin',
//     ])
//     .persist()
