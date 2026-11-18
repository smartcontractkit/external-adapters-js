import nock from 'nock'

import {
  API_HOST_SANDBOX,
  AUTH_PATH,
  ISIN,
  OTHER_ISIN,
  POSITIONS_PATH,
  loginReply,
  password,
  positionsPageOneLastOfTwo,
  positionsPageOneWithMatch,
  positionsPageZero,
  positionsPageZeroDuplicate,
  positionsPageZeroFirstOfTwo,
  positionsPageZeroFractionalQuantity,
  positionsPageZeroLastNotBoolean,
  positionsPageZeroMorePagesThanTotalPages,
  positionsPageZeroNegativeQuantity,
  positionsPageZeroQuantityNotNumber,
  positionsPageZeroQuantityNull,
  positionsPageZeroTotalPagesNotInteger,
  positionsPageZeroWithOtherIsin,
  positionsPageZeroWithoutPositions,
  positionsPageZeroZeroQuantity,
  userId,
} from './fixtures'
import {
  BASE_ENV,
  CapturedRequest,
  FIXED_NOW,
  restoreEnv,
  setEnv,
  waitFor,
  withAdapter,
} from './helpers'

jest.setTimeout(30000)

const loginBody = (body: { username?: string; password?: string }): boolean =>
  body.username === userId && body.password === password

const REPLY_OK = (body: nock.ReplyBody) =>
  function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
    captured.push({ uri, headers: { ...this.req.headers } })
    return [200, body]
  }

let captured: CapturedRequest[]

describe('reserve endpoint', () => {
  let dateSpy: jest.SpyInstance
  let savedEnv: Record<string, string | undefined>

  beforeAll(() => {
    nock.disableNetConnect()
    savedEnv = setEnv(BASE_ENV)
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW)
  })

  afterAll(() => {
    restoreEnv(savedEnv)
    nock.enableNetConnect()
    dateSpy.mockRestore()
    nock.restore()
  })

  beforeEach(() => {
    captured = []
  })

  afterEach(() => {
    dateSpy.mockReturnValue(FIXED_NOW)
    nock.cleanAll()
  })

  const scope = () => nock(API_HOST_SANDBOX, { encodedQueryParams: true })

  it('publishes the recorded quantity as result and data.result', async () => {
    let logins = 0
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [200, loginReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZero))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.data).toEqual({ result: 100, ripcord: false })
      expect(body.timestamps).toEqual({
        providerDataRequestedUnixMs: FIXED_NOW,
        providerDataReceivedUnixMs: FIXED_NOW,
      })
      expect(body.timestamps).not.toHaveProperty('providerIndicatedTimeUnixMs')
      expect(body).toMatchSnapshot()
    })

    expect(logins).toBe(1)
    expect(captured).toHaveLength(1)
  })

  it('publishes the position quantity and not another numeric field of the reply', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZero))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.result).toBe(100)
      expect(body.result).not.toBe(28642.7911)
      expect(body.result).not.toBe(300)
      expect(body.result).not.toBe(24741)
      expect(body.result).not.toBe(341.27)
      expect(body).toMatchSnapshot()
    })
  })

  it('publishes a quantity with more decimals unmodified', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZeroFractionalQuantity))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.result).toBe(100.123456789)
      expect(body.data.result).toBe(100.123456789)
      expect(body).toMatchSnapshot()
    })
  })

  it.each([
    ['zero', positionsPageZeroZeroQuantity, 0],
    ['negative', positionsPageZeroNegativeQuantity, -12.5],
  ])('publishes a %s quantity as given', async (_name, reply, expected) => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(reply))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.result).toBe(expected)
      expect(body.data.result).toBe(expected)
      expect(body).toMatchSnapshot()
    })
  })

  it('selects the configured ISIN among the reply positions', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZeroWithOtherIsin))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.result).toBe(100)
      expect(body.result).not.toBe(42.5)
      expect(body).toMatchSnapshot()
    })
  })

  it('reads every page until last true and filters the configured ISIN across pages', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZeroFirstOfTwo))
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(REPLY_OK(positionsPageOneLastOfTwo))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })

    expect(captured.map((request) => request.uri)).toEqual([
      `${POSITIONS_PATH}?page=0&size=20`,
      `${POSITIONS_PATH}?page=1&size=20`,
    ])
  })

  it('stops at the page that has last true and does not request the next page', async () => {
    let nextPageRequests = 0
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZero))
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(function (): nock.ReplyFnResult {
        nextPageRequests += 1
        return [200, positionsPageOneLastOfTwo]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    expect(captured).toHaveLength(1)
    expect(captured[0].uri).toBe(`${POSITIONS_PATH}?page=0&size=20`)
    expect(nextPageRequests).toBe(0)
  })

  it('rejects a reply that claims more pages than totalPages', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZeroMorePagesThanTotalPages))
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(REPLY_OK(positionsPageOneLastOfTwo))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'The data provider returned more pages than totalPages',
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it.each([
    ['in one page', positionsPageZeroDuplicate, positionsPageOneLastOfTwo, 1],
    ['across pages', positionsPageZeroFirstOfTwo, positionsPageOneWithMatch, 2],
  ])(
    'rejects more than one position with the configured ISIN %s',
    async (_name, firstPage, secondPage, pages) => {
      scope()
        .post(AUTH_PATH, loginBody)
        .reply(200, loginReply)
        .get(POSITIONS_PATH)
        .query({ page: '0', size: '20' })
        .reply(REPLY_OK(firstPage))
        .get(POSITIONS_PATH)
        .query({ page: '1', size: '20' })
        .reply(REPLY_OK(secondPage))

      await withAdapter({}, async (testAdapter) => {
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(502)
        expect(response.json().errorMessage).toBe(
          `The data provider returned more than one position for ISIN ${ISIN}`,
        )
        expect(response.json()).not.toHaveProperty('result')
        expect(response.json()).toMatchSnapshot()

        const later = await testAdapter.request({})
        expect(later.statusCode).toBe(502)
        expect(later.json()).not.toHaveProperty('result')
      })

      expect(captured.length).toBeGreaterThanOrEqual(pages)
    },
  )

  it('rejects a reply with no position for the configured ISIN', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZero))

    await withAdapter({ AMINA_ISIN: OTHER_ISIN }, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        `The data provider returned no position for ISIN ${OTHER_ISIN}`,
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it.each([
    ['positions is absent', positionsPageZeroWithoutPositions],
    ['last is not a boolean', positionsPageZeroLastNotBoolean],
    ['totalPages is not an integer', positionsPageZeroTotalPagesNotInteger],
  ])('rejects an unusable positions page when %s', async (_name, reply) => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(reply))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'The data provider returned an unusable positions page',
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it.each([
    ['a string', positionsPageZeroQuantityNotNumber],
    ['null', positionsPageZeroQuantityNull],
  ])('rejects a quantity that is %s', async (_name, reply) => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(reply))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        `The data provider returned an unusable quantity for ISIN ${ISIN}`,
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it('surfaces a provider connection failure as a 502', async () => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .replyWithError({ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(typeof response.json().errorMessage).toBe('string')
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it('keeps the last good report when a later fetch fails', async () => {
    let failedFetches = 0
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        captured.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageZero]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (): nock.ReplyFnResult {
        failedFetches += 1
        return [500, { message: 'provider down' }]
      })

    await withAdapter({}, async (testAdapter) => {
      const first = await testAdapter.request({})
      expect(first.statusCode).toBe(200)

      await waitFor(() => failedFetches >= 1)
      const later = await testAdapter.request({})
      expect(later.statusCode).toBe(200)
      expect(later.json().result).toBe(100)
      expect(later.json()).toMatchSnapshot()
    })
  })

  it('takes the report timestamps from the first page GET and the last page reply', async () => {
    let now = FIXED_NOW
    dateSpy.mockImplementation(() => now)

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        captured.push({ uri, headers: { ...this.req.headers } })
        now += 300
        return [200, positionsPageZeroFirstOfTwo]
      })
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        captured.push({ uri, headers: { ...this.req.headers } })
        now += 300
        return [200, positionsPageOneLastOfTwo]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)

      expect(response.json().timestamps).toEqual({
        providerDataRequestedUnixMs: FIXED_NOW,
        providerDataReceivedUnixMs: FIXED_NOW + 600,
      })
      expect(response.json().timestamps).not.toHaveProperty('providerIndicatedTimeUnixMs')
      expect(response.json()).toMatchSnapshot()
    })
  })

  it.each([
    ['an empty body', {}],
    ['the endpoint name', { endpoint: 'reserve' }],
    ['an unknown field', { unexpected: 'value' }],
  ])('accepts a request with %s', async (_name, request) => {
    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(REPLY_OK(positionsPageZero))

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request(request)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
