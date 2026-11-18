import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { createHmac } from 'crypto'
import nock from 'nock'
import {
  ACCESS_TOKEN_1,
  ACCESS_TOKEN_2,
  AGREEMENT_NUMBER,
  API_HOST,
  AUTH_FAILURE_BODY,
  DUPLICATE_FIRST_PAGE,
  DUPLICATE_PAGE,
  DUPLICATE_SECOND_PAGE,
  EMPTY_PAGE,
  FIRST_OF_TWO_PAGE,
  HMAC_SECRET,
  LATER_DATE_HEADER,
  MATCHING_ISIN,
  NO_MATCH_PAGE,
  ONE_MATCH_PAGE,
  PASSWORD,
  POSITIONS_FAILURE_BODY,
  REFRESH_BODY,
  REFRESH_TOKEN_1,
  SECOND_OF_TWO_PAGE,
  USER_ID,
} from '../fixtures'
import { mockAuth, mockPositions, positionsPath } from './fixtures'

const NOW = 1773100800000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CapturedRequest = {
  path: string
  headers: Record<string, string>
  body?: unknown
}

const capture = (
  request: { path: string; headers: Record<string, string> },
  rawBody?: string,
): CapturedRequest => ({
  path: request.path,
  headers: Object.fromEntries(
    Object.entries(request.headers).map(([name, value]) => [name.toLowerCase(), String(value)]),
  ),
  body: rawBody ? JSON.parse(rawBody) : undefined,
})

const captureInto = (requests: CapturedRequest[]) => {
  return (
    request: { path: string; headers: Record<string, string> },
    _interceptor: unknown,
    rawBody?: string,
  ): void => {
    requests.push(capture(request, rawBody))
  }
}

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const request = (portfolio: string, isin = MATCHING_ISIN) => ({
    endpoint: 'reserves',
    portfolio,
    isin,
  })

  const expectSignature = (headers: Record<string, string>, portfolio: string): void => {
    expect(headers['amina-uri']).toBe(positionsPath(portfolio))
    expect(headers['amina-timestamp']).toBe(String(Math.floor(NOW / 1000)))
    expect(headers['amina-nonce']).toMatch(UUID)
    expect(headers['x-request-id']).toMatch(UUID)
    expect(headers['x-correlation-id']).toMatch(UUID)
    expect(headers['amina-context-agreement-number']).toBe(AGREEMENT_NUMBER)
    expect(headers['user-agent']).toBeTruthy()

    const message = [
      'GET',
      headers['amina-timestamp'],
      headers['amina-nonce'],
      headers['amina-uri'],
      USER_ID,
      AGREEMENT_NUMBER,
    ].join('\n')
    expect(headers['amina-signature']).toBe(
      createHmac('sha256', HMAC_SECRET).update(message).digest('base64'),
    )
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = API_HOST
    process.env.AMINA_USER_ID = USER_ID
    process.env.AMINA_PASSWORD = PASSWORD
    process.env.AMINA_HMAC_SECRET = HMAC_SECRET
    process.env.AMINA_AGREEMENT_NUMBER = AGREEMENT_NUMBER
    process.env.BACKGROUND_EXECUTE_MS = '100000'

    spy = jest.spyOn(Date, 'now').mockReturnValue(NOW)
    nock.disableNetConnect()

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    if (testAdapter) {
      await testAdapter.api.close()
    }
    nock.enableNetConnect()
    nock.cleanAll()
    spy.mockRestore()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('reserves endpoint', () => {
    it('should return success', async () => {
      const portfolio = '910000001'
      mockAuth()
      const page1 = mockPositions(portfolio, 1, SECOND_OF_TWO_PAGE)
      mockPositions(portfolio, 0, ONE_MATCH_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(page1.isDone()).toBe(false)
    })

    it('should use the default endpoint when the request omits it', async () => {
      const portfolio = '910000002'
      mockAuth()
      mockPositions(portfolio, 0, ONE_MATCH_PAGE)

      const response = await testAdapter.request({ portfolio, isin: MATCHING_ISIN })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('provider requests', () => {
    it('should sign every page with the documented headers and reuse one token', async () => {
      const portfolio = '910000003'
      const authRequests: CapturedRequest[] = []
      const pageRequests: CapturedRequest[] = []

      mockAuth().on('request', captureInto(authRequests))
      mockPositions(portfolio, 0, FIRST_OF_TWO_PAGE).on('request', captureInto(pageRequests))
      mockPositions(portfolio, 1, SECOND_OF_TWO_PAGE, 200, LATER_DATE_HEADER).on(
        'request',
        captureInto(pageRequests),
      )

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()

      expect(authRequests).toHaveLength(1)
      expect(authRequests[0].body).toEqual({ username: USER_ID, password: PASSWORD })
      expect(authRequests[0].headers['x-request-id']).toMatch(UUID)
      expect(authRequests[0].headers['x-correlation-id']).toMatch(UUID)
      expect(authRequests[0].headers['authorization']).toBeUndefined()
      expect(authRequests[0].headers['amina-signature']).toBeUndefined()

      expect(pageRequests).toHaveLength(2)
      for (const page of pageRequests) {
        expect(page.headers['authorization']).toBe(`Bearer ${ACCESS_TOKEN_1}`)
        expectSignature(page.headers, portfolio)
      }
      expect(pageRequests[0].headers['amina-nonce']).not.toBe(
        pageRequests[1].headers['amina-nonce'],
      )
    })

    it('should read page 0 then page 1 with size 20 and stop when last is true', async () => {
      const portfolio = '910000004'
      const pageRequests: CapturedRequest[] = []

      mockAuth()
      mockPositions(portfolio, 0, FIRST_OF_TWO_PAGE).on('request', captureInto(pageRequests))
      mockPositions(portfolio, 1, SECOND_OF_TWO_PAGE, 200, LATER_DATE_HEADER).on(
        'request',
        captureInto(pageRequests),
      )

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(pageRequests).toHaveLength(2)
      expect(pageRequests[0].path).toContain('page=0')
      expect(pageRequests[0].path).toContain('size=20')
      expect(pageRequests[1].path).toContain('page=1')
      expect(pageRequests[1].path).toContain('size=20')
    })
  })

  describe('failure responses', () => {
    it('should return 502 when no position has the configured ISIN', async () => {
      const portfolio = '910000005'
      mockAuth()
      mockPositions(portfolio, 0, NO_MATCH_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when the provider returns no positions', async () => {
      const portfolio = '910000016'
      mockAuth()
      mockPositions(portfolio, 0, EMPTY_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 for a duplicate ISIN on one page', async () => {
      const portfolio = '910000006'
      mockAuth()
      mockPositions(portfolio, 0, DUPLICATE_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 for a duplicate ISIN across pages', async () => {
      const portfolio = '910000007'
      mockAuth()
      mockPositions(portfolio, 0, DUPLICATE_FIRST_PAGE)
      mockPositions(portfolio, 1, DUPLICATE_SECOND_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 for the recorded provider error class on a positions GET', async () => {
      const portfolio = '910000008'
      mockAuth()
      mockPositions(portfolio, 0, POSITIONS_FAILURE_BODY, 400)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return 502 when the login is rejected and not request positions', async () => {
      const portfolio = '910000009'
      mockAuth(API_HOST, AUTH_FAILURE_BODY, 401)
      const page = mockPositions(portfolio, 0, ONE_MATCH_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
      expect(page.isDone()).toBe(false)
    })

    it('should return 502 when the login reply has no tokens and not request positions', async () => {
      const portfolio = '910000017'
      mockAuth(API_HOST, {})
      const page = mockPositions(portfolio, 0, ONE_MATCH_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
      expect(page.isDone()).toBe(false)
    })

    it('should return 502 when the provider connection fails', async () => {
      const portfolio = '910000010'
      mockAuth()
      nock(API_HOST, { encodedQueryParams: true })
        .get(positionsPath(portfolio))
        .query({ page: 0, size: 20 })
        .replyWithError('socket hang up')

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('input validation', () => {
    const cases = [
      {
        name: 'an absent portfolio',
        data: { endpoint: 'reserves', isin: MATCHING_ISIN },
        parameter: 'portfolio',
      },
      {
        name: 'a non-string portfolio',
        data: { endpoint: 'reserves', portfolio: 123, isin: MATCHING_ISIN },
        parameter: 'portfolio',
      },
      {
        name: 'an absent isin',
        data: { endpoint: 'reserves', portfolio: '910000011' },
        parameter: 'isin',
      },
      {
        name: 'a non-string isin',
        data: { endpoint: 'reserves', portfolio: '910000012', isin: 123 },
        parameter: 'isin',
      },
    ]

    it.each(cases)('should return 400 for $name', async ({ data, parameter }) => {
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json().error.message).toContain(`Param: ${parameter}`)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('token renewal', () => {
    it('should renew once on a page 401 and replay that page', async () => {
      const portfolio = '910000013'
      const authRequests: CapturedRequest[] = []
      const pageRequests: CapturedRequest[] = []

      mockAuth().on('request', captureInto(authRequests))
      mockAuth(API_HOST, REFRESH_BODY).on('request', captureInto(authRequests))
      mockPositions(portfolio, 0, ONE_MATCH_PAGE, 401).on('request', captureInto(pageRequests))
      mockPositions(portfolio, 0, ONE_MATCH_PAGE).on('request', captureInto(pageRequests))

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(authRequests).toHaveLength(2)
      expect(authRequests[0].body).toEqual({ username: USER_ID, password: PASSWORD })
      expect(authRequests[1].body).toEqual({ refreshToken: REFRESH_TOKEN_1 })
      expect(pageRequests).toHaveLength(2)
      expect(pageRequests[1].headers['authorization']).toBe(`Bearer ${ACCESS_TOKEN_2}`)
      expect(pageRequests[1].headers['amina-nonce']).not.toBe(
        pageRequests[0].headers['amina-nonce'],
      )
    })

    it('should renew a later page without re-fetching the earlier page', async () => {
      const portfolio = '910000018'
      const pageRequests: CapturedRequest[] = []

      mockAuth()
      mockAuth(API_HOST, REFRESH_BODY)
      mockPositions(portfolio, 0, FIRST_OF_TWO_PAGE).on('request', captureInto(pageRequests))
      mockPositions(portfolio, 1, SECOND_OF_TWO_PAGE, 401).on('request', captureInto(pageRequests))
      mockPositions(portfolio, 1, SECOND_OF_TWO_PAGE).on('request', captureInto(pageRequests))

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(pageRequests).toHaveLength(3)
      expect(pageRequests[0].path).toContain('page=0')
      expect(pageRequests[1].path).toContain('page=1')
      expect(pageRequests[2].path).toContain('page=1')
    })

    it('should fall back to a login when the refresh is rejected', async () => {
      const portfolio = '910000014'
      const authRequests: CapturedRequest[] = []

      mockAuth().on('request', captureInto(authRequests))
      mockAuth(API_HOST, AUTH_FAILURE_BODY, 401).on('request', captureInto(authRequests))
      mockAuth(API_HOST, REFRESH_BODY).on('request', captureInto(authRequests))
      mockPositions(portfolio, 0, ONE_MATCH_PAGE, 401)
      mockPositions(portfolio, 0, ONE_MATCH_PAGE)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      expect(authRequests).toHaveLength(3)
      expect(authRequests[0].body).toEqual({ username: USER_ID, password: PASSWORD })
      expect(authRequests[1].body).toEqual({ refreshToken: REFRESH_TOKEN_1 })
      expect(authRequests[2].body).toEqual({ username: USER_ID, password: PASSWORD })
    })

    it('should return 502 on a second 401 without another renewal', async () => {
      const portfolio = '910000015'
      const authRequests: CapturedRequest[] = []

      mockAuth().on('request', captureInto(authRequests))
      mockAuth(API_HOST, REFRESH_BODY).on('request', captureInto(authRequests))
      mockPositions(portfolio, 0, ONE_MATCH_PAGE, 401)
      mockPositions(portfolio, 0, ONE_MATCH_PAGE, 401)

      const response = await testAdapter.request(request(portfolio))

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
      expect(authRequests).toHaveLength(2)
    })
  })
})
