import { createHmac } from 'crypto'
import nock from 'nock'

import {
  API_HOST_SANDBOX,
  AUTH_PATH,
  POSITIONS_PATH,
  agreementNumber,
  hmacSecret,
  hmacSignatureMismatchBody,
  loginReply,
  password,
  positionsPageOneLastOfTwo,
  positionsPageZero,
  positionsPageZeroFirstOfTwo,
  refreshReply,
  secondLoginReply,
  userId,
} from './fixtures'
import {
  BASE_ENV,
  CapturedRequest,
  FIXED_NOW,
  UUID_V4,
  restoreEnv,
  setEnv,
  withAdapter,
} from './helpers'

jest.setTimeout(30000)

const loginBody = (body: { username?: string; password?: string }): boolean =>
  body.username === userId && body.password === password

const refreshBody = (body: { refreshToken?: string }): boolean =>
  typeof body.refreshToken === 'string'

const expectedSignature = (headers: Record<string, string>): string => {
  const message = [
    'GET',
    headers['amina-timestamp'],
    headers['amina-nonce'],
    headers['amina-uri'],
    userId,
    agreementNumber,
  ].join('\n')
  return createHmac('sha256', hmacSecret).update(message).digest('base64')
}

describe('authentication and request signing', () => {
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

  afterEach(() => {
    nock.cleanAll()
  })

  const scope = () => nock(API_HOST_SANDBOX, { encodedQueryParams: true })

  it('logs in once and signs every page with the recorded header set', async () => {
    const logins: CapturedRequest[] = []
    const pages: CapturedRequest[] = []

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        logins.push({ uri, headers: { ...this.req.headers } })
        return [200, loginReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageZeroFirstOfTwo]
      })
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageOneLastOfTwo]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    expect(logins).toHaveLength(1)
    expect(logins[0].uri).toBe(AUTH_PATH)
    expect(logins[0].headers['x-request-id']).toMatch(UUID_V4)
    expect(logins[0].headers['x-correlation-id']).toMatch(UUID_V4)
    expect(logins[0].headers['content-type']).toContain('application/json')

    expect(pages).toHaveLength(2)
    for (const page of pages) {
      const headers = page.headers
      expect(headers['authorization']).toBe(`Bearer ${loginReply.accessToken}`)
      expect(headers['x-request-id']).toMatch(UUID_V4)
      expect(headers['x-correlation-id']).toMatch(UUID_V4)
      expect(headers['amina-nonce']).toMatch(UUID_V4)
      expect(headers['amina-timestamp']).toBe(String(Math.floor(FIXED_NOW / 1000)))
      expect(headers['amina-uri']).toBe(POSITIONS_PATH)
      expect(headers['amina-signature']).toBe(expectedSignature(headers))
      expect(headers['amina-context-agreement-number']).toBe(agreementNumber)
    }

    expect(pages[0].uri).toBe(`${POSITIONS_PATH}?page=0&size=20`)
    expect(pages[1].uri).toBe(`${POSITIONS_PATH}?page=1&size=20`)
    expect(pages[0].headers['amina-nonce']).not.toBe(pages[1].headers['amina-nonce'])

    const requestIds = [
      logins[0].headers['x-request-id'],
      pages[0].headers['x-request-id'],
      pages[1].headers['x-request-id'],
    ]
    expect(new Set(requestIds).size).toBe(3)
  })

  it('renews the token on a 401 and repeats the same page', async () => {
    const pages: CapturedRequest[] = []
    let logins = 0
    let refreshes = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [200, loginReply]
      })
      .post(AUTH_PATH, refreshBody)
      .reply(function (): nock.ReplyFnResult {
        refreshes += 1
        return [200, refreshReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [401, {}]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageZero]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(200, positionsPageZero)

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })

    expect(logins).toBe(1)
    expect(refreshes).toBe(1)
    expect(pages).toHaveLength(2)
    expect(pages[0].headers['authorization']).toBe(`Bearer ${loginReply.accessToken}`)
    expect(pages[1].headers['authorization']).toBe(`Bearer ${refreshReply.accessToken}`)
    expect(pages[1].uri).toBe(`${POSITIONS_PATH}?page=0&size=20`)
    expect(pages[1].headers['amina-nonce']).not.toBe(pages[0].headers['amina-nonce'])
    expect(pages[1].headers['amina-signature']).toBe(expectedSignature(pages[1].headers))
  })

  it('logs in again when the refresh is rejected', async () => {
    const pages: CapturedRequest[] = []
    let logins = 0
    let refreshes = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [200, loginReply]
      })
      .post(AUTH_PATH, refreshBody)
      .reply(function (): nock.ReplyFnResult {
        refreshes += 1
        return [400, {}]
      })
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [200, secondLoginReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [401, {}]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageZero]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(200, positionsPageZero)

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })

    expect(logins).toBe(2)
    expect(refreshes).toBe(1)
    expect(pages).toHaveLength(2)
    expect(pages[1].headers['authorization']).toBe(`Bearer ${secondLoginReply.accessToken}`)
    expect(pages[1].headers['amina-signature']).toBe(expectedSignature(pages[1].headers))
  })

  it('rejects a second 401 on the repeated page without another renewal', async () => {
    const pages: CapturedRequest[] = []
    let logins = 0
    let refreshes = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [200, loginReply]
      })
      .post(AUTH_PATH, refreshBody)
      .reply(function (): nock.ReplyFnResult {
        refreshes += 1
        return [200, refreshReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [401, {}]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [401, {}]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'The data provider rejected the renewed access token',
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })

    expect(logins).toBe(1)
    expect(refreshes).toBe(1)
    expect(pages).toHaveLength(2)
  })

  it('renews a 401 from a later page without refetching the earlier page', async () => {
    const pages: CapturedRequest[] = []
    let refreshes = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .post(AUTH_PATH, refreshBody)
      .reply(function (): nock.ReplyFnResult {
        refreshes += 1
        return [200, refreshReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageZeroFirstOfTwo]
      })
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [401, {}]
      })
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [200, positionsPageOneLastOfTwo]
      })
      .get(POSITIONS_PATH)
      .query({ page: '1', size: '20' })
      .reply(200, positionsPageOneLastOfTwo)

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })

    expect(refreshes).toBe(1)
    expect(pages.map((page) => page.uri)).toEqual([
      `${POSITIONS_PATH}?page=0&size=20`,
      `${POSITIONS_PATH}?page=1&size=20`,
      `${POSITIONS_PATH}?page=1&size=20`,
    ])
    expect(pages[2].headers['amina-nonce']).not.toBe(pages[1].headers['amina-nonce'])
    expect(pages[2].headers['amina-signature']).toBe(expectedSignature(pages[2].headers))
  })

  it('surfaces a rejected login as a 502 with the framework message and no page GET', async () => {
    let logins = 0
    let pages = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(function (): nock.ReplyFnResult {
        logins += 1
        return [401, {}]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (): nock.ReplyFnResult {
        pages += 1
        return [200, positionsPageZero]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe('Request failed with status code 401')
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })

    expect(logins).toBe(1)
    expect(pages).toBe(0)
  })

  it('rejects an auth reply without both tokens', async () => {
    let pages = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, { accessToken: 'only-an-access-token' })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (): nock.ReplyFnResult {
        pages += 1
        return [200, positionsPageZero]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe(
        'The data provider returned an unusable authentication response',
      )
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })

    expect(pages).toBe(0)
  })

  it('does not retry a non-401 page error', async () => {
    let pages = 0
    let refreshes = 0

    scope()
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .post(AUTH_PATH, refreshBody)
      .reply(function (): nock.ReplyFnResult {
        refreshes += 1
        return [200, refreshReply]
      })
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (): nock.ReplyFnResult {
        pages += 1
        return [400, hmacSignatureMismatchBody]
      })

    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toBe('Request failed with status code 400')
      expect(response.json()).not.toHaveProperty('result')
      expect(response.json()).toMatchSnapshot()
    })

    expect(pages).toBe(1)
    expect(refreshes).toBe(0)
  })
})
