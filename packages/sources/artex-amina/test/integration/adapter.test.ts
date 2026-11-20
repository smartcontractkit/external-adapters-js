import '@chainlink/external-adapter-framework'
import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  ACCESS_TOKEN,
  AGREEMENT,
  AUTH_PATH,
  HMAC_SECRET,
  HOST,
  PASSWORD,
  REFRESH_TOKEN,
  RELOGIN_ACCESS_TOKEN,
  USER_ID,
  makeFixtures,
  page,
  position,
} from './fixtures'

const { mockLogin, mockRefreshError, mockPositionsPage, mockPositionsError } = makeFixtures(HOST)

const portfolio = (n: number): string => `90000${String(n).padStart(4, '0')}`
const isin = (n: number): string => `DE00000000${String(n).padStart(2, '0')}`

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = HOST
    process.env.AMINA_USER_ID = USER_ID
    process.env.AMINA_PASSWORD = PASSWORD
    process.env.AMINA_HMAC_SECRET = HMAC_SECRET
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT
    // These timings make the response arrive before the next provider read, so
    // the counters below see only the calls of the request under test.
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '100'
    process.env.CACHE_POLLING_MAX_RETRIES = '20'
    process.env.CACHE_POLLING_SLEEP_MS = '10'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  beforeEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('success', () => {
    it('publishes the matched position as result, data.result and data.aum', async () => {
      expect(testAdapter.adapter).toBeInstanceOf(PoRAdapter)
      expect(testAdapter.adapter.name).toBe('ARTEX_AMINA')
      expect(testAdapter.adapter.defaultEndpoint).toBe('reserve')
      expect(testAdapter.adapter.endpoints.map((endpoint) => endpoint.name)).toEqual(['reserve'])

      const p = portfolio(1)
      const i = isin(1)
      const login = mockLogin().persist()
      const positions = mockPositionsPage(
        0,
        page({ positions: [position(i, 7654.3219)] }),
        ACCESS_TOKEN,
        p,
      ).persist()

      const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(login.isDone()).toBe(true)
      expect(positions.isDone()).toBe(true)
    })
  })

  describe('no matching position', () => {
    it.each([
      ['an empty positions array', page({ positions: [] })],
      ['only another ISIN', page({ positions: [position(isin(91), 12.5)] })],
    ])('returns 502 for %s', async (_, body) => {
      const p = portfolio(3)
      const i = isin(3)
      mockLogin().persist()
      mockPositionsPage(0, body, ACCESS_TOKEN, p).persist()

      const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('duplicate ISIN', () => {
    it.each([
      [
        'on one page',
        [page({ positions: [position(isin(4), 7654.3219), position(isin(4), 1.5)] })],
      ],
      [
        'across pages',
        [
          page({
            positions: [position(isin(4), 7654.3219)],
            totalPages: 2,
            number: 0,
            last: false,
          }),
          page({ positions: [position(isin(4), 1.5)], totalPages: 2, number: 1, first: false }),
        ],
      ],
    ])('returns 502 when the ISIN appears %s', async (_, pages) => {
      const p = portfolio(4)
      const i = isin(4)
      mockLogin().persist()
      pages.forEach((body, pageNo) => mockPositionsPage(pageNo, body, ACCESS_TOKEN, p).persist())

      const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  it('returns 502 when a positions element is not a position object', async () => {
    const p = portfolio(11)
    const i = isin(11)
    mockLogin().persist()
    mockPositionsPage(0, page({ positions: [null] }), ACCESS_TOKEN, p).persist()

    const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns 502 when the quantity is negative', async () => {
    const p = portfolio(5)
    const i = isin(5)
    mockLogin().persist()
    mockPositionsPage(0, page({ positions: [position(i, -1)] }), ACCESS_TOKEN, p).persist()

    const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  describe('provider error status', () => {
    it.each([
      [400, { title: 'Bad request', instance: 'provider-error-instance', status: 400 }],
      [403, 'Not authorized'],
    ])('returns 502 when a positions GET gives %i', async (status, body) => {
      const p = portfolio(6)
      const i = isin(6)
      mockLogin().persist()
      mockPositionsError(0, status, body, ACCESS_TOKEN, p).persist()

      const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  it('returns 502 when the login fails without a refresh or a second login', async () => {
    const p = portfolio(7)
    const i = isin(7)
    const authBodies: Record<string, unknown>[] = []
    const refreshBodies: Record<string, unknown>[] = []
    let positionsCalls = 0
    const bodyOf = (body: unknown): Record<string, unknown> =>
      typeof body === 'string' ? JSON.parse(body) : (body as Record<string, unknown>)

    // A login failure must not refresh: a refresh without a refresh token is a
    // provider error, and sending the login again cannot turn the 401 into a
    // success. Every auth POST increments the list.
    nock(HOST)
      .post(AUTH_PATH)
      .reply(401, (_uri, body) => {
        const parsed = bodyOf(body)
        authBodies.push(parsed)
        if ('refreshToken' in parsed) {
          refreshBodies.push(parsed)
        }
        return { title: 'Unauthorized', status: 401 }
      })
      .persist()
    nock(HOST)
      .get(`/api/b2c/v1/securities/portfolios/${p}/positions`)
      .query(true)
      .reply(500, () => {
        positionsCalls += 1
        return ''
      })
      .persist()

    const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

    expect(authBodies).toEqual([{ username: USER_ID, password: PASSWORD }])
    expect(refreshBodies).toEqual([])
    expect(positionsCalls).toBe(0)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('returns 502 when a provider 500 is not retried inside the request', async () => {
    const p = portfolio(8)
    const i = isin(8)
    let positionsCalls = 0
    mockLogin().persist()
    // RETRY is 0 because a repeated signed request reuses its nonce and
    // timestamp and the provider rejects it. Every positions GET increments the
    // counter.
    mockPositionsError(
      0,
      500,
      { title: 'Provider failure', status: 500 },
      ACCESS_TOKEN,
      p,
      {},
      () => {
        positionsCalls += 1
      },
    ).persist()

    const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

    expect(positionsCalls).toBe(1)
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('logs in again when a 401 refresh is rejected and replays the page', async () => {
    const p = portfolio(9)
    const i = isin(9)
    let loginCalls = 0
    const login = mockLogin(
      () => (loginCalls++ === 0 ? ACCESS_TOKEN : RELOGIN_ACCESS_TOKEN),
      REFRESH_TOKEN,
    ).persist()
    mockPositionsError(0, 401, '', ACCESS_TOKEN, p, { 'WWW-Authenticate': 'Bearer' }).persist()
    const refresh = mockRefreshError(401, {
      title: 'Unauthorized',
      status: 401,
    }).persist()
    const replay = mockPositionsPage(
      0,
      page({ positions: [position(i, 7654.3219)] }),
      RELOGIN_ACCESS_TOKEN,
      p,
    ).persist()

    const response = await testAdapter.request({ endpoint: 'reserve', portfolio: p, isin: i })

    expect(login.isDone()).toBe(true)
    expect(loginCalls).toBe(2)
    expect(refresh.isDone()).toBe(true)
    expect(replay.isDone()).toBe(true)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  describe('input validation', () => {
    it.each([
      ['portfolio', { endpoint: 'reserve', isin: isin(10) }],
      ['isin', { endpoint: 'reserve', portfolio: portfolio(10) }],
    ])('returns 400 when %s is missing', async (_, data) => {
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
