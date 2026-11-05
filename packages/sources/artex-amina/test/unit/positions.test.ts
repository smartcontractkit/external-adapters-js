import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import type { AuthManager } from '../../src/transport/auth'
import { fetchAllPositions, selectQuantity } from '../../src/transport/positions'

const settings = {
  apiEndpoint: 'https://amina.test',
  userId: '25742014',
  hmacSecret: 'hmac-secret',
  agreementNumber: '157769',
  userAgent: 'chainlink-artex-amina-adapter/1.0.0',
  retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
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

describe('AMINA positions', () => {
  let requester: { request: jest.Mock }
  let auth: { getAccessToken: jest.Mock }

  beforeEach(() => {
    requester = { request: jest.fn() }
    auth = {
      getAccessToken: jest.fn().mockResolvedValue('token-1'),
    }
  })

  const fetchPositions = () =>
    fetchAllPositions({
      requester: requester as unknown as Requester,
      auth: auth as unknown as AuthManager,
      settings,
      portfolioNo: 157769305,
    })

  it('fetches one page and signs the positions URI without the query', async () => {
    requester.request.mockResolvedValueOnce(
      pageResponse({
        positions: [{ isin: 'US0378331005', quantity: 100.5 }],
        totalPages: 1,
        last: true,
        number: 0,
      }),
    )

    const result = await fetchPositions()

    expect(result).toEqual({
      positions: [{ isin: 'US0378331005', quantity: 100.5 }],
      firstPageRequestedUnixMs: 1_000,
      lastPageReceivedUnixMs: 2_000,
    })

    const [key, request] = requester.request.mock.calls[0]
    expect(key).toBe('amina-positions:157769305:0')
    expect(request.url).toBe('/api/b2c/v1/securities/portfolios/157769305/positions?page=0&size=20')
    expect(request.baseURL).toBe('https://amina.test')
    expect(request.headers).toMatchObject({
      Authorization: 'Bearer token-1',
      'Amina-Context-Agreement-Number': '157769',
      'Amina-Uri': '/api/b2c/v1/securities/portfolios/157769305/positions',
      'User-Agent': 'chainlink-artex-amina-adapter/1.0.0',
    })
    expect(request.headers?.['Amina-Signature']).toBeTruthy()
  })

  it('follows last across pages and keeps the first and last timestamps', async () => {
    requester.request
      .mockResolvedValueOnce(
        pageResponse(
          {
            positions: [{ isin: 'OTHER', quantity: 1 }],
            totalPages: 2,
            last: false,
            number: 0,
          },
          1_000,
          1_100,
        ),
      )
      .mockResolvedValueOnce(
        pageResponse(
          {
            positions: [{ isin: 'US0378331005', quantity: 100.5 }],
            totalPages: 2,
            last: true,
            number: 1,
          },
          1_200,
          1_300,
        ),
      )

    const result = await fetchPositions()

    expect(result.positions).toEqual([
      { isin: 'OTHER', quantity: 1 },
      { isin: 'US0378331005', quantity: 100.5 },
    ])
    expect(result.firstPageRequestedUnixMs).toBe(1_000)
    expect(result.lastPageReceivedUnixMs).toBe(1_300)
    expect(requester.request.mock.calls[1][1].url).toContain('page=1&size=20')
  })

  it.each([
    [
      'a page number mismatch',
      { totalPages: 2, last: false, number: 1 },
      'AMINA returned page 1 for requested page 0',
    ],
    [
      'last=false on the final totalPages',
      { totalPages: 1, last: false, number: 0 },
      'AMINA paging ended before last=true',
    ],
    [
      'last=true before totalPages',
      { totalPages: 2, last: true, number: 0 },
      'AMINA last=true before totalPages',
    ],
    [
      'a missing page number',
      { totalPages: 1, last: true },
      'AMINA positions response has an invalid number',
    ],
  ])('rejects %s', async (_, body, message) => {
    requester.request.mockResolvedValueOnce(pageResponse({ positions: [], ...body }))

    await expect(fetchPositions()).rejects.toThrow(message)
  })

  it('rejects a totalPages change between pages', async () => {
    requester.request
      .mockResolvedValueOnce(
        pageResponse({
          positions: [{ isin: 'OTHER', quantity: 1 }],
          totalPages: 3,
          last: false,
          number: 0,
        }),
      )
      .mockResolvedValueOnce(
        pageResponse({
          positions: [{ isin: 'US0378331005', quantity: 100.5 }],
          totalPages: 2,
          last: true,
          number: 1,
        }),
      )

    await expect(fetchPositions()).rejects.toThrow('AMINA totalPages changed from 3 to 2')
    expect(requester.request).toHaveBeenCalledTimes(2)
  })

  it('selects the matching ISIN', () => {
    expect(
      selectQuantity(
        [
          { isin: 'OTHER', quantity: 1 },
          { isin: 'US0378331005', quantity: 100.5 },
        ],
        'US0378331005',
      ),
    ).toBe(100.5)
  })
})
