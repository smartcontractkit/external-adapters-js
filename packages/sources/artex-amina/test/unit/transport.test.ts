import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { AuthManager } from '../../src/transport/auth'
import { formatErrorBody, mapAminaError } from '../../src/transport/errors'
import { authUrl, positionsPath, trimEndpoint } from '../../src/transport/paths'
import { fetchAllPositions } from '../../src/transport/positions'
import { DEFAULT_RETRY, isRetryableError, retryDelay, withRetry } from '../../src/transport/retry'
import { buildHmacPayload, buildSignedGetHeaders, signHmac } from '../../src/transport/signing'

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

function page(overrides: Record<string, unknown> = {}) {
  return { positions: [], last: true, ...overrides }
}

function providerError(status: number): AdapterDataProviderError {
  return new AdapterDataProviderError(
    { statusCode: 502, providerStatusCode: status, message: `status ${status}` },
    timestamps,
  )
}

describe('AMINA transport', () => {
  beforeAll(() => {
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
  })

  afterAll(() => {
    Object.assign(DEFAULT_RETRY, { maxAttempts: 3, baseDelayMs: 2_000, maxDelayMs: 40_000 })
  })

  it('signs the manual HMAC example', () => {
    const payload = buildHmacPayload({
      method: 'GET',
      timestamp: '1659002057',
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      uri: '/partners/150661/accounts/1506614001/balances',
      userId: '12345678',
      agreementNumber: '123456-1',
    })

    expect(payload).toBe(
      'GET\n1659002057\n83dc868e-7a56-4fdf-897b-f2ab57fee916\n/partners/150661/accounts/1506614001/balances\n12345678\n123456-1',
    )
    expect(signHmac(payload, 'secret')).toBe('MK/pcsl6ySrUFMrFgya054imx1sJhVzCM6uOmdq6O+k=')
  })

  it('builds the manual signed headers with a pinned nonce and timestamp', () => {
    const headers = buildSignedGetHeaders({
      uri: '/partners/150661/accounts/1506614001/balances',
      token: 'access-token',
      userId: '12345678',
      hmacSecret: 'secret',
      agreementNumber: '123456-1',
      userAgent: 'chainlink-artex-amina-adapter/1.0.0',
      now: 1659002057000,
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
    })

    expect(headers).toMatchObject({
      Authorization: 'Bearer access-token',
      'User-Agent': 'chainlink-artex-amina-adapter/1.0.0',
      'Amina-Context-Agreement-Number': '123456-1',
      'Amina-Nonce': '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      'Amina-Timestamp': '1659002057',
      'Amina-Uri': '/partners/150661/accounts/1506614001/balances',
      'Amina-Signature': 'MK/pcsl6ySrUFMrFgya054imx1sJhVzCM6uOmdq6O+k=',
    })
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    expect(headers['X-Request-Id']).toMatch(UUID)
    expect(headers['X-Correlation-Id']).toMatch(UUID)
  })

  it('trims trailing slashes and builds the AMINA URLs', () => {
    expect(trimEndpoint('https://amina.test///')).toBe('https://amina.test')
    expect(authUrl('https://amina.test///')).toBe('https://amina.test/api/b2c/v1/auth')
    expect(positionsPath(157769305)).toBe('/api/b2c/v1/securities/portfolios/157769305/positions')
  })

  it('uses fresh nonce and signature per signed request', () => {
    const input = {
      uri: '/api/b2c/v1/securities/portfolios/157769305/positions',
      token: 'access-token',
      userId: '25742014',
      hmacSecret: 'secret',
      agreementNumber: '157769',
      userAgent: 'chainlink-artex-amina-adapter/1.0.0',
    }

    const first = buildSignedGetHeaders(input)
    const second = buildSignedGetHeaders(input)

    expect(first['Amina-Uri']).toBe('/api/b2c/v1/securities/portfolios/157769305/positions')
    expect(first['Amina-Nonce']).not.toBe(second['Amina-Nonce'])
    expect(first['Amina-Signature']).not.toBe(second['Amina-Signature'])
  })

  it('fetches all pages and keeps first/last timestamps', async () => {
    const requester = { request: jest.fn() }
    const auth = { getAccessToken: jest.fn().mockResolvedValue('token') }
    requester.request
      .mockResolvedValueOnce(
        pageResponse(
          page({ positions: [{ isin: 'OTHER', quantity: 1 }], last: false }),
          1_000,
          1_100,
        ),
      )
      .mockResolvedValueOnce(
        pageResponse(
          page({ positions: [{ isin: 'US0378331005', quantity: 100.5 }] }),
          1_200,
          1_300,
        ),
      )

    const result = await fetchAllPositions({
      requester: requester as unknown as Requester,
      auth: auth as unknown as AuthManager,
      settings,
      portfolioNo: 157769305,
    })

    expect(result.positions).toEqual([
      { isin: 'OTHER', quantity: 1 },
      { isin: 'US0378331005', quantity: 100.5 },
    ])
    expect(result.firstPageRequestedUnixMs).toBe(1_000)
    expect(result.lastPageReceivedUnixMs).toBe(1_300)
    expect(requester.request.mock.calls[1][1].url).toContain('page=1&size=20')
  })

  it('fails after the maximum number of pages', async () => {
    const requester = {
      request: jest.fn().mockResolvedValue(pageResponse(page({ last: false }))),
    }
    const auth = { getAccessToken: jest.fn().mockResolvedValue('token') }

    await expect(
      fetchAllPositions({
        requester: requester as unknown as Requester,
        auth: auth as unknown as AuthManager,
        settings,
        portfolioNo: 157769305,
      }),
    ).rejects.toThrow('AMINA pagination exceeded 100 pages')
    expect(requester.request).toHaveBeenCalledTimes(100)
  })

  it('re-signs each positions attempt before retrying', async () => {
    const requester = { request: jest.fn() }
    const auth = { getAccessToken: jest.fn().mockResolvedValue('token') }
    requester.request
      .mockRejectedValueOnce(providerError(500))
      .mockResolvedValueOnce(
        pageResponse(page({ positions: [{ isin: 'US0378331005', quantity: 100.5 }] })),
      )

    const previousRetry = { ...DEFAULT_RETRY }
    Object.assign(DEFAULT_RETRY, { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 })
    try {
      await fetchAllPositions({
        requester: requester as unknown as Requester,
        auth: auth as unknown as AuthManager,
        settings,
        portfolioNo: 157769305,
      })
    } finally {
      Object.assign(DEFAULT_RETRY, previousRetry)
    }

    expect(requester.request).toHaveBeenCalledTimes(2)
    const firstHeaders = requester.request.mock.calls[0][1].headers
    const secondHeaders = requester.request.mock.calls[1][1].headers
    expect(firstHeaders['Amina-Nonce']).not.toBe(secondHeaders['Amina-Nonce'])
    expect(firstHeaders['Amina-Signature']).not.toBe(secondHeaders['Amina-Signature'])
  })

  it.each([
    ['a page without positions', { last: true }, 'AMINA positions response is malformed'],
    [
      'a position with an invalid quantity',
      page({ positions: [{ isin: 'US0378331005', quantity: -1 }] }),
      'AMINA positions response is malformed',
    ],
    [
      'a position without an isin',
      page({ positions: [{ quantity: 1 }] }),
      'AMINA positions response is malformed',
    ],
    ['a non-object position', page({ positions: [null] }), 'AMINA positions response is malformed'],
    [
      'a position with a non-finite quantity',
      page({ positions: [{ isin: 'US0378331005', quantity: Number.NaN }] }),
      'AMINA positions response is malformed',
    ],
  ])('rejects %s', async (_, data, message) => {
    const requester = { request: jest.fn().mockResolvedValueOnce(pageResponse(data)) }
    const auth = { getAccessToken: jest.fn().mockResolvedValue('token') }

    await expect(
      fetchAllPositions({
        requester: requester as unknown as Requester,
        auth: auth as unknown as AuthManager,
        settings,
        portfolioNo: 157769305,
      }),
    ).rejects.toThrow(message)
  })

  it.each([
    ['500', providerError(500)],
    ['429', providerError(429)],
    [
      'connection',
      new AdapterConnectionError(
        { statusCode: 502, message: 'connection' },
        {
          providerDataRequestedUnixMs: 1,
          providerDataReceivedUnixMs: 2,
          providerIndicatedTimeUnixMs: undefined,
        },
      ),
    ],
  ])('retries %s and then succeeds', async (_, error) => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok')

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).resolves.toBe(
      'ok',
    )
    expect(fn).toHaveBeenCalledTimes(2)
    expect(isRetryableError(error)).toBe(true)
  })

  it('classifies rate-limit and unknown errors', () => {
    expect(
      isRetryableError(new AdapterRateLimitError({ message: 'queue overflow', statusCode: 429 })),
    ).toBe(true)
    expect(isRetryableError(new Error('boom'))).toBe(false)
  })

  it('caps the exponential retry delay', () => {
    const options = { maxAttempts: 6, baseDelayMs: 2_000, maxDelayMs: 40_000 }

    expect([0, 1, 4, 5].map((attempt) => retryDelay(attempt, options))).toEqual([
      2_000, 4_000, 32_000, 40_000,
    ])
  })

  it('stops after the maximum attempts', async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(providerError(500))

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'status 500',
    )
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry 403', async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValueOnce(providerError(403))

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'status 403',
    )
    expect(fn).toHaveBeenCalledTimes(1)
    expect(isRetryableError(providerError(403))).toBe(false)
  })

  it('does not echo secrets in connection errors', () => {
    const mapped = mapAminaError(
      new AdapterConnectionError(
        { statusCode: 502, message: 'Authorization: Bearer secret Amina-Signature: secret' },
        timestamps,
      ),
    )

    expect(mapped.message).toBe('AMINA connection failed')
    expect(mapped.message).not.toContain('Bearer')
  })

  it('keeps only safe provider fields and handles a bodyless error', () => {
    const mapped = mapAminaError(
      new AdapterDataProviderError(
        {
          statusCode: 502,
          providerStatusCode: 500,
          message: 'raw Authorization: Bearer secret',
          errorResponse: {
            title: 'Forbidden',
            detail: 'Authorization: Bearer secret',
            instance: 'instance-1',
          },
        },
        timestamps,
      ),
    )

    expect(mapped.message).toBe('AMINA request failed (500): Forbidden | instance-1')
    expect(mapped.message).not.toContain('Bearer')

    const noBody = mapAminaError(
      new AdapterDataProviderError({ statusCode: 502, message: 'no body' }, timestamps),
    )
    expect(noBody.message).toBe('AMINA request failed')
  })

  it('passes through AdapterError and maps unknown errors', () => {
    const original = new AdapterError({ statusCode: 400, message: 'bad input' })

    expect(mapAminaError(original)).toBe(original)
    expect(mapAminaError(new Error('boom'))).toMatchObject({
      statusCode: 502,
      message: 'AMINA request failed',
    })
  })

  it('sanitizes and truncates provider error fields', () => {
    expect(formatErrorBody(null)).toBeUndefined()
    expect(formatErrorBody('nope')).toBeUndefined()
    expect(formatErrorBody({ title: 'a'.repeat(250), instance: 'instance-1' })).toBe(
      `${'a'.repeat(200)}... | instance-1`,
    )
    expect(formatErrorBody({ title: 'Invalid token', instance: 'instance-1' })).toBe('instance-1')
    expect(
      formatErrorBody({
        title: 'Forbidden',
        detail: 'Authorization: Bearer secret',
        instance: 'instance-1',
      }),
    ).toBe('Forbidden | instance-1')
  })
})
