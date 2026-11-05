import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import type { AuthManager } from '../../src/transport/auth'
import { fetchAllPositions } from '../../src/transport/positions'
import { buildHmacPayload, buildSignedGetHeaders, signHmac } from '../../src/transport/signing'
import {
  DEFAULT_RETRY,
  isRetryableError,
  mapAminaError,
  withRetry,
} from '../../src/transport/utils'

const settings = {
  apiEndpoint: 'https://amina.test',
  userId: '25742014',
  hmacSecret: 'hmac-secret',
  agreementNumber: '157769',
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
    {
      providerDataRequestedUnixMs: 1,
      providerDataReceivedUnixMs: 2,
      providerIndicatedTimeUnixMs: undefined,
    },
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

  it.each([
    ['a page without positions', { last: true }, 'AMINA positions response has no positions array'],
    [
      'a position with an invalid quantity',
      page({ positions: [{ isin: 'US0378331005', quantity: -1 }] }),
      'AMINA position 0 has an invalid quantity',
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

  it('does not retry 403 and does not echo secrets', async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValueOnce(providerError(403))
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).rejects.toThrow(
      'status 403',
    )
    expect(fn).toHaveBeenCalledTimes(1)
    expect(isRetryableError(providerError(403))).toBe(false)

    const mapped = mapAminaError(
      new AdapterConnectionError(
        { statusCode: 502, message: 'Authorization: Bearer secret Amina-Signature: secret' },
        {
          providerDataRequestedUnixMs: 1,
          providerDataReceivedUnixMs: 2,
          providerIndicatedTimeUnixMs: undefined,
        },
      ),
    )
    expect(mapped.message).toBe('AMINA connection failed')
    expect(mapped.message).not.toContain('Bearer')
  })
})
