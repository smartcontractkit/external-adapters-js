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

function page(overrides: Record<string, unknown>) {
  return { positions: [], totalPages: 1, last: true, number: 0, ...overrides }
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
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
    requester.request
      .mockResolvedValueOnce(
        pageResponse(
          page({
            positions: [{ isin: 'OTHER', quantity: 1 }],
            totalPages: 2,
            last: false,
            number: 0,
          }),
          1_000,
          1_100,
        ),
      )
      .mockResolvedValueOnce(
        pageResponse(
          page({
            positions: [{ isin: 'US0378331005', quantity: 100.5 }],
            totalPages: 2,
            number: 1,
          }),
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
    ['page number mismatch', [{ totalPages: 2, last: false, number: 1 }], 'AMINA returned page 1'],
    ['last=false at totalPages', [{ totalPages: 1, last: false, number: 0 }], 'AMINA paging ended'],
    ['last=true before totalPages', [{ totalPages: 2, last: true, number: 0 }], 'AMINA last=true'],
    [
      'totalPages change',
      [
        { totalPages: 3, last: false, number: 0 },
        { totalPages: 2, last: true, number: 1 },
      ],
      'AMINA totalPages changed',
    ],
    [
      'missing number',
      [{ totalPages: 1, last: true, number: undefined }],
      'AMINA positions response has an invalid number',
    ],
  ])('rejects %s', async (_, pages, message) => {
    const requester = { request: jest.fn() }
    const auth = { getAccessToken: jest.fn().mockResolvedValue('token') }
    Object.assign(DEFAULT_RETRY, { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 })
    pages.forEach((p) => requester.request.mockResolvedValueOnce(pageResponse(page(p))))

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
    ['500', providerError(500), 2],
    ['429', providerError(429), 2],
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
      2,
    ],
  ])('retries %s and then succeeds', async (_, error, calls) => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok')

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 })).resolves.toBe(
      'ok',
    )
    expect(fn).toHaveBeenCalledTimes(calls)
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
