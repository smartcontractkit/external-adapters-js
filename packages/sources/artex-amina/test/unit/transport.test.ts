import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { AuthManager } from '../../src/transport/auth'
import { mapAminaError } from '../../src/transport/errors'
import { fetchAllPositions, MAX_PAGES } from '../../src/transport/positions'
import { DEFAULT_RETRY, isRetryableError, retryDelay, withRetry } from '../../src/transport/retry'
import { buildSignedGetHeaders } from '../../src/transport/signing'

const ISIN = 'US0378331005'
const PORTFOLIO_NO = 157769305
const USER_AGENT = 'chainlink-artex-amina-adapter/1.0.0'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const settings = {
  apiEndpoint: 'https://amina.test',
  userId: '25742014',
  hmacSecret: 'hmac-secret',
  agreementNumber: '157769',
}

const timestamps = {
  providerDataRequestedUnixMs: 1,
  providerDataReceivedUnixMs: 2,
  providerIndicatedTimeUnixMs: undefined,
}

function pageResponse(data: unknown, requested = 1_000, received = 2_000) {
  return {
    response: { status: 200, data },
    timestamps: {
      providerDataRequestedUnixMs: requested,
      providerDataReceivedUnixMs: received,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}

function page(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { positions: [], totalPages: 1, number: 0, last: true, ...overrides }
}

function providerError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    { statusCode: 502, providerStatusCode: status, message: `status ${status}` },
    timestamps,
  )
}

function connectionError(): AdapterConnectionError {
  return new AdapterConnectionError({ statusCode: 502, message: 'connection failed' }, timestamps)
}

function fetchPositions(requester: { request: jest.Mock }) {
  return fetchAllPositions({
    requester: requester as unknown as Requester,
    auth: { getAccessToken: async () => 'token' } as unknown as AuthManager,
    settings,
    portfolioNo: PORTFOLIO_NO,
  })
}

describe('HMAC signing', () => {
  it('builds the manual HMAC-SHA256 example', () => {
    const headers = buildSignedGetHeaders({
      uri: '/partners/150661/accounts/1506614001/balances',
      token: 'access-token',
      userId: '12345678',
      hmacSecret: 'secret',
      agreementNumber: '123456-1',
      userAgent: USER_AGENT,
      now: 1_659_002_057_000,
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
    })

    expect(headers).toEqual({
      Authorization: 'Bearer access-token',
      'X-Request-Id': expect.stringMatching(UUID),
      'X-Correlation-Id': expect.stringMatching(UUID),
      'User-Agent': USER_AGENT,
      'Amina-Context-Agreement-Number': '123456-1',
      'Amina-Nonce': '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      'Amina-Timestamp': '1659002057',
      'Amina-Uri': '/partners/150661/accounts/1506614001/balances',
      'Amina-Signature': 'MK/pcsl6ySrUFMrFgya054imx1sJhVzCM6uOmdq6O+k=',
    })
  })
})

describe('fetchAllPositions', () => {
  it('reads every page with one token and fresh signatures', async () => {
    const requester = {
      request: jest
        .fn()
        .mockResolvedValueOnce(
          pageResponse(
            page({
              positions: [{ isin: 'OTHER', quantity: 1 }],
              totalPages: 2,
              number: 0,
              last: false,
            }),
            1_000,
            1_100,
          ),
        )
        .mockResolvedValueOnce(
          pageResponse(
            page({
              positions: [{ isin: ISIN, quantity: 12345.6789 }],
              totalPages: 2,
              number: 1,
            }),
            1_200,
            1_300,
          ),
        ),
    }

    const result = await fetchPositions(requester)

    expect(result.positions).toEqual([
      { isin: 'OTHER', quantity: 1 },
      { isin: ISIN, quantity: 12345.6789 },
    ])
    expect(result.firstPageRequestedUnixMs).toBe(1_000)
    expect(result.lastPageReceivedUnixMs).toBe(1_300)

    const first = requester.request.mock.calls[0][1].headers
    const second = requester.request.mock.calls[1][1].headers
    expect(second['Amina-Nonce']).not.toBe(first['Amina-Nonce'])
    expect(second['Amina-Signature']).not.toBe(first['Amina-Signature'])
    expect(second.Authorization).toBe(first.Authorization)
    expect(second['Amina-Uri']).toBe(first['Amina-Uri'])
  })

  const paginationFailures: Array<[string, Record<string, unknown>, string]> = [
    ['a page with no positions', { totalPages: 1, number: 0, last: true }, 'malformed'],
    [
      'a quantity with more than four decimals',
      page({ positions: [{ isin: ISIN, quantity: 1.23456 }] }),
      'malformed',
    ],
    [
      'a page number mismatch',
      page({ totalPages: 2, number: 1, last: false }),
      'returned page 1 for requested page 0',
    ],
    [
      'last=true before totalPages',
      page({ totalPages: 2, number: 0, last: true }),
      'last=true before totalPages',
    ],
    [
      'positions with totalPages=0',
      page({ positions: [{ isin: ISIN, quantity: 1 }], totalPages: 0, number: 0 }),
      'totalPages=0',
    ],
    [
      'more pages than the cap',
      page({ totalPages: MAX_PAGES + 1, number: 0, last: false }),
      `exceeds ${MAX_PAGES} pages`,
    ],
  ]

  it.each(paginationFailures)('rejects %s', async (_, data, message) => {
    const requester = { request: jest.fn().mockResolvedValueOnce(pageResponse(data)) }

    await expect(fetchPositions(requester)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining(message),
    })
  })

  it('re-signs each retried positions request with a fresh nonce', async () => {
    const requester = { request: jest.fn() }
    requester.request
      .mockRejectedValueOnce(providerError(500))
      .mockResolvedValueOnce(
        pageResponse(page({ positions: [{ isin: ISIN, quantity: 12345.6789 }] })),
      )

    const previousRetry = { ...DEFAULT_RETRY }
    Object.assign(DEFAULT_RETRY, { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 })
    try {
      await fetchPositions(requester)
    } finally {
      Object.assign(DEFAULT_RETRY, previousRetry)
    }

    const first = requester.request.mock.calls[0][1].headers
    const second = requester.request.mock.calls[1][1].headers
    expect(second['Amina-Nonce']).not.toBe(first['Amina-Nonce'])
    expect(second['Amina-Signature']).not.toBe(first['Amina-Signature'])
    expect(second.Authorization).toBe(first.Authorization)
  })
})

describe('retry policy', () => {
  const retryableErrors: Array<[string, unknown, boolean]> = [
    ['a 429 response', providerError(429), true],
    ['a connection failure', connectionError(), true],
    ['a 401 response', providerError(401), false],
    ['a 403 response', providerError(403), false],
  ]

  it.each(retryableErrors)('classifies %s as retryable=%s', (_, error, expected) => {
    expect(isRetryableError(error)).toBe(expected)
  })

  it('caps exponential backoff at 40 seconds', () => {
    const options = { maxAttempts: 6, baseDelayMs: 2_000, maxDelayMs: 40_000 }

    expect([0, 1, 5].map((attempt) => retryDelay(attempt, options))).toEqual([2_000, 4_000, 40_000])
  })

  it('stops after the maximum attempts and rethrows the last error', async () => {
    const fn = jest.fn().mockRejectedValue(providerError(500))

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'status 500',
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('mapAminaError', () => {
  const sanitizedFailures: Array<[string, unknown, string]> = [
    [
      'secret-bearing provider fields',
      new AdapterDataProviderError(
        {
          statusCode: 502,
          providerStatusCode: 403,
          message: 'raw provider error',
          errorResponse: {
            title: 'Authorization: Bearer secret accessToken=abc',
            instance: 'instance-1',
          },
        },
        timestamps,
      ),
      'AMINA request failed (403): instance-1',
    ],
    [
      'connection failures',
      new AdapterConnectionError(
        { statusCode: 502, message: 'Authorization: Bearer secret' },
        timestamps,
      ),
      'AMINA connection failed',
    ],
  ]

  it.each(sanitizedFailures)('maps %s to a sanitized 502', (_, error, message) => {
    const mapped = mapAminaError(error)

    expect(mapped).toMatchObject({ statusCode: 502, message })
    expect(mapped.message).not.toContain('Bearer')
  })
})
