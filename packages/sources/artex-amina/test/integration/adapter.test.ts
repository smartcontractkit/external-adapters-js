import { ReserveHarness, UUID_PATTERN } from '../fixtures/harness'
import {
  authBody,
  ISIN,
  page,
  pageMetadata,
  position,
  recordedBadSignatureBody,
  recordedPositionsPage0,
  POSITIONS_PATH,
} from '../fixtures/amina'

const nonMatchingPositions = (count: number): Record<string, unknown>[] =>
  Array.from({ length: count }, (_, index) => position({ isin: 'CH0000000001', quantity: index }))

describe('reserve endpoint', () => {
  const harness = new ReserveHarness()
  const { fake } = harness

  beforeAll(async () => {
    await harness.start()
  })

  afterAll(async () => {
    await harness.stop()
  })

  beforeEach(async () => {
    await harness.prepare()
  })

  it('publishes the recorded position quantity as the reserve result', async () => {
    // Interceptors are installed by prepare, so prepare again with the reply
    // delayed: the reported request and response timestamps then cannot
    // collapse onto the same millisecond.
    await harness.prepare((provider) => {
      provider.positionsDelayMs = 50
    })
    fake.page(0, { statusCode: 200, body: recordedPositionsPage0 })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(200)
    expect(body.statusCode).toBe(200)
    expect(body.result).toBe(100)
    expect(body.data).toEqual({ result: 100, ripcord: false })
    expect(Object.keys(body.data as object).sort()).toEqual(['result', 'ripcord'])
    for (const navField of ['navPerShare', 'navDate', 'nativeFee', 'linkFee']) {
      expect(body).not.toHaveProperty(navField)
      expect(body.data).not.toHaveProperty(navField)
    }

    expect(fake.positionsRequests).toHaveLength(1)
    expect(fake.positionsRequests[0].page).toBe(0)
    const requestedAt = body.timestamps?.providerDataRequestedUnixMs as number
    const receivedAt = body.timestamps?.providerDataReceivedUnixMs as number
    expect(requestedAt).toBeLessThanOrEqual(fake.positionsRequests[0].at)
    expect(fake.positionsRequests[0].at - requestedAt).toBeLessThan(200)
    expect(receivedAt).toBeGreaterThanOrEqual(fake.positionsRequests[0].at)
    expect(receivedAt - requestedAt).toBeGreaterThanOrEqual(40)
    expect(body.timestamps?.providerIndicatedTimeUnixMs).toBeUndefined()
  })

  it('rejects a negative quantity as unusable provider data', async () => {
    fake.page(0, { statusCode: 200, body: page({ positions: [position({ quantity: -1 })] }) })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.statusCode).toBe(502)
    expect(body.errorMessage).toContain('-1')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
  })

  it.each([
    {
      matchingPositions: 0,
      pages: [{ positions: [position({ isin: 'CH0000000001' })] }],
      statusCode: 502,
      result: undefined,
    },
    {
      matchingPositions: 1,
      pages: [{ positions: [position()] }],
      statusCode: 200,
      result: 100,
    },
    {
      matchingPositions: 2,
      pages: [{ positions: [position(), position({ quantity: 5 })], totalElements: 2 }],
      statusCode: 502,
      result: undefined,
    },
    {
      matchingPositions: 2,
      pages: [
        {
          positions: [position({ quantity: 1 }), ...nonMatchingPositions(19)],
          ...pageMetadata(0, 2, 21),
        },
        { positions: [position({ quantity: 2 })], ...pageMetadata(1, 2, 21) },
      ],
      statusCode: 502,
      result: undefined,
    },
  ])(
    'responds $statusCode when the portfolio holds $matchingPositions matching position(s)',
    async ({ matchingPositions, pages, statusCode, result }) => {
      pages.forEach((pageBody, index) => {
        fake.page(index, { statusCode: 200, body: page({ number: index, ...pageBody }) })
      })

      const { response, body } = await harness.request()

      expect(response.statusCode).toBe(statusCode)
      expect(fake.positionsRequests.map((request) => request.page)).toEqual(
        pages.map((_, index) => index),
      )
      if (statusCode === 200) {
        expect(body.result).toBe(result)
        expect(body.data).toEqual({ result, ripcord: false })
      } else {
        expect(body.errorMessage).toBeDefined()
        expect(body.result).toBeUndefined()
        expect(body.data).toBeUndefined()
        if (matchingPositions === 0) {
          expect(body.errorMessage).toContain(ISIN)
        } else {
          expect(body.errorMessage).toContain(`${matchingPositions} positions`)
        }
      }
    },
  )

  it('reads the next page while last is false, with the same bearer token', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({
        positions: nonMatchingPositions(20),
        ...pageMetadata(0, 2, 21),
      }),
    })
    fake.page(1, {
      statusCode: 200,
      body: page({
        positions: [position({ quantity: 42.5 })],
        ...pageMetadata(1, 2, 21),
      }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(200)
    expect(body.result).toBe(42.5)
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 1])
    expect(fake.positionsRequests.map((request) => request.size)).toEqual(['20', '20'])
    expect(fake.positionsRequests[0].headers.authorization).toMatch(/^Bearer .+/)
    expect(fake.positionsRequests[0].headers.authorization).toBe(
      fake.positionsRequests[1].headers.authorization,
    )
  })

  it('rejects pages that deliver fewer rows than totalElements', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({
        positions: nonMatchingPositions(19),
        ...pageMetadata(0, 2, 21),
      }),
    })
    fake.page(1, {
      statusCode: 200,
      body: page({
        positions: [position()],
        ...pageMetadata(1, 2, 21),
      }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('expected 21 positions, received 20')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 1])
  })

  it('rejects page 0 when it claims to be last before the declared last page', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({
        positions: [position({ quantity: 7 })],
        ...pageMetadata(0, 3, 41),
        last: true,
      }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('last')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0])
  })

  it('rejects page 0 when it denies being last on the declared last page', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({
        positions: [position({ quantity: 33.25 })],
        ...pageMetadata(0, 1, 1),
        last: false,
      }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('last')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0])
  })

  it('rejects a middle page that claims to be last', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({
        positions: [position({ isin: 'CH0000000001' })],
        ...pageMetadata(0, 3, 41),
      }),
    })
    fake.page(1, {
      statusCode: 200,
      body: page({
        positions: [position()],
        ...pageMetadata(1, 3, 41),
        last: true,
      }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('last')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 1])
  })

  it.each([
    {
      inconsistency: 'totalPages is zero with last false and no positions',
      pages: [{ positions: [], ...pageMetadata(0, 0, 0), last: false }],
      message: 'last',
    },
    {
      inconsistency: 'totalPages changes between pages',
      pages: [
        { positions: [position({ isin: 'CH0000000001' })], ...pageMetadata(0, 2, 21) },
        { positions: [position()], ...pageMetadata(1, 3, 41), last: false },
      ],
      message: 'page metadata changed after page 0',
    },
  ])('rejects unusable pagination when $inconsistency', async ({ pages, message }) => {
    pages.forEach((pageBody, index) => {
      fake.page(index, { statusCode: 200, body: page({ number: index, ...pageBody }) })
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain(message)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
  })

  it('treats an empty portfolio as a valid no-match', async () => {
    fake.page(0, {
      statusCode: 200,
      body: page({ positions: [], ...pageMetadata(0, 0, 0) }),
    })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain(`no position for ISIN ${ISIN}`)
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0])
  })

  it('keeps the parser unusable-data error through the positions request', async () => {
    fake.page(0, { statusCode: 200, body: page({ positions: [null] }) })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('AMINA positions response is unusable')
    expect(body.errorMessage).toContain('positions[0]')
    expect(body.errorMessage).not.toContain('provider status')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })

  it('reports the recorded bad-signature reply as a provider error', async () => {
    fake.page(0, { statusCode: 400, body: recordedBadSignatureBody })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.statusCode).toBe(502)
    expect(body.errorMessage).toContain('provider status 400')
    expect(body.errorMessage).toContain('HMAC signature mismatch.')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests).toHaveLength(1)
  })

  it('sends the bearer token, HMAC headers, and User-Agent on the positions request', async () => {
    fake.page(0, { statusCode: 200, body: recordedPositionsPage0 })

    const { response } = await harness.request()

    expect(response.statusCode).toBe(200)
    expect(fake.positionsRequests).toHaveLength(1)
    const request = fake.positionsRequests[0]

    expect(request.path).toContain(`${POSITIONS_PATH}?`)
    expect(request.page).toBe(0)
    expect(request.size).toBe('20')
    expect(request.headers['authorization']).toBe(`Bearer ${authBody().accessToken}`)
    expect(request.headers['amina-nonce']).toMatch(UUID_PATTERN)
    expect(request.headers['amina-timestamp']).toMatch(/^\d+$/)
    expect(request.headers['amina-uri']).toBe(POSITIONS_PATH)
    expect(request.headers['amina-uri']).not.toContain('?')
    expect(request.headers['amina-signature']).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(request.headers['amina-context-agreement-number']).toBe('123456-1')
    expect(request.headers['user-agent']).toMatch(/chainlink-artex-amina/i)
    expect(request.headers['x-request-id']).toMatch(UUID_PATTERN)
    expect(request.headers['x-correlation-id']).toMatch(UUID_PATTERN)
  })

  it.each([
    {
      change: 'totalElements changes after page 0',
      secondPage: { positions: [position()], ...pageMetadata(1, 2, 40) },
    },
    {
      change: 'size changes after page 0',
      secondPage: { positions: [position()], ...pageMetadata(1, 2, 42, { size: 21 }) },
    },
  ])('rejects page metadata that changes after page 0 when $change', async ({ secondPage }) => {
    fake.page(0, {
      statusCode: 200,
      body: page({ positions: nonMatchingPositions(20), ...pageMetadata(0, 2, 21) }),
    })
    fake.page(1, { statusCode: 200, body: page(secondPage) })

    const { response, body } = await harness.request()

    expect(response.statusCode).toBe(502)
    expect(body.errorMessage).toContain('page metadata changed after page 0')
    expect(body.result).toBeUndefined()
    expect(body.data).toBeUndefined()
    expect(fake.positionsRequests.map((request) => request.page)).toEqual([0, 1])
  })
})
