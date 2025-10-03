import nock from 'nock'
import { ErrorResponse, SuccessResponse, TEST_BEARER_TOKEN, TEST_URL } from '../../utils/testConfig'

export const mockHappyPathResponseSuccess = (artworkId: string, navPerShare: string): nock.Scope =>
  nock(TEST_URL)
    .get(`/artwork/${artworkId}/price`)
    .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
    .reply(
      200,
      () => ({
        ...SuccessResponse,
        artwork_id: `${artworkId}`,
        nav_per_share: navPerShare,
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

export const mockResponseFailure = (artworkId: string): nock.Scope =>
  nock(TEST_URL)
    .get(`/artwork/${artworkId}/price`)
    .matchHeader('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
    .reply(
      200,
      () => ({
        ...ErrorResponse,
        artwork_id: `${artworkId}`,
        message: `Asset ID '${artworkId}' not found`,
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
