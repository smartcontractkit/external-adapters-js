import type { LoggerFactory } from '@chainlink/external-adapter-framework/util'

import nock from 'nock'

import {
  API_HOST_CUSTOM,
  API_HOST_PRODUCTION,
  API_HOST_SANDBOX,
  AUTH_PATH,
  PORTFOLIO,
  POSITIONS_PATH,
  agreementNumber,
  hmacSecret,
  loginReply,
  password,
  positionsPageZero,
  userId,
} from './fixtures'
import {
  BASE_ENV,
  CapturedRequest,
  FIXED_NOW,
  importConfig,
  restoreEnv,
  setEnv,
  withAdapter,
} from './helpers'

jest.setTimeout(30000)

const requiredSettings = [
  'AMINA_USER_ID',
  'AMINA_PASSWORD',
  'AMINA_HMAC_SECRET',
  'AMINA_AGREEMENT_NUMBER',
  'AMINA_PORTFOLIO',
  'AMINA_ISIN',
]

const loginBody = (body: { username?: string; password?: string }): boolean =>
  body.username === userId && body.password === password

type LogMethod = (...args: unknown[]) => unknown
type RecordedLog = { level: string; args: unknown[] }

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const

// Wraps the framework's production logger factory so that the test records each
// log line the adapter actually emits and still passes the call to the
// production logger. The adapter loggers are created on their first call, so
// the wrapper installed before the first request is the factory they use.
function recordLogCalls(base: LoggerFactory, records: RecordedLog[]): LoggerFactory {
  const enabled = (logger: unknown, level: string): boolean => {
    const check = (logger as { isLevelEnabled?: (value: string) => boolean }).isLevelEnabled
    return typeof check === 'function' && check.call(logger, level)
  }

  const wrap = (logger: unknown): Record<string, unknown> => {
    const target = logger as Record<string, unknown>
    const wrapped: Record<string, unknown> = {
      child: (params: { layer: string; color?: string }) =>
        wrap((target.child as (p: unknown) => unknown)(params)),
    }
    for (const level of LOG_LEVELS) {
      wrapped[level] = (...args: unknown[]) => {
        if (enabled(target, level)) {
          records.push({ level, args })
        }
        return (target[level] as LogMethod)(...args)
      }
    }
    return wrapped
  }

  return {
    child: (params) => wrap(base.child(params)) as unknown as ReturnType<LoggerFactory['child']>,
  }
}

describe('configuration and adapter wiring', () => {
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

  it('declares the PoR adapter, the reserve endpoint and no input parameters', async () => {
    jest.resetModules()
    const { adapter } = await import('../../src')
    const { AdapterConfig } = await import('@chainlink/external-adapter-framework/config')
    const { PoRAdapter, PoRProviderEndpoint } = await import(
      '@chainlink/external-adapter-framework/adapter/por'
    )

    expect(adapter).toBeInstanceOf(PoRAdapter)
    expect(adapter.name).toBe('ARTEX_AMINA')
    expect(adapter.defaultEndpoint).toBe('reserve')
    expect(adapter.endpoints).toHaveLength(1)
    expect(adapter.endpoints[0]).toBeInstanceOf(PoRProviderEndpoint)
    expect(adapter.endpoints[0].name).toBe('reserve')
    expect(adapter.endpoints[0].aliases).toEqual([])
    expect(adapter.endpoints[0].inputParameters.definition).toEqual({})
    expect(adapter.config).toBeInstanceOf(AdapterConfig)
  })

  it('starts production configuration with the six settings and the production host', async () => {
    nock(API_HOST_PRODUCTION, { encodedQueryParams: true })
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(200, positionsPageZero)

    await withAdapter({ API_ENDPOINT: undefined }, async (testAdapter) => {
      const settings = testAdapter.adapter.config.settings as unknown as Record<string, unknown>
      expect(settings.API_ENDPOINT).toBe(API_HOST_PRODUCTION)
      expect(settings.AMINA_USER_ID).toBe(userId)
      expect(settings.AMINA_PASSWORD).toBe(password)
      expect(settings.AMINA_HMAC_SECRET).toBe(hmacSecret)
      expect(settings.AMINA_AGREEMENT_NUMBER).toBe(agreementNumber)
      expect(settings.AMINA_PORTFOLIO).toBe(PORTFOLIO)
      expect(settings.AMINA_ISIN).toBe('US0378331005')
      expect(settings.RETRY).toBe(0)

      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })
  })

  it.each(requiredSettings)('fails startup when %s is absent', async (name) => {
    const saved = setEnv({ [name]: undefined })
    try {
      const { config } = await importConfig()
      expect(() => {
        config.initialize()
        config.validate()
      }).toThrow(new RegExp(name))
    } finally {
      restoreEnv(saved)
    }
  })

  it('derives both provider URLs from API_ENDPOINT', async () => {
    nock(API_HOST_CUSTOM, { encodedQueryParams: true })
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(200, positionsPageZero)

    await withAdapter({ API_ENDPOINT: API_HOST_CUSTOM }, async (testAdapter) => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(100)
      expect(response.json()).toMatchSnapshot()
    })
  })

  it('writes no access token, signature, nonce or timestamp to the log when the positions GET fails', async () => {
    const pages: CapturedRequest[] = []
    nock(API_HOST_SANDBOX, { encodedQueryParams: true })
      .post(AUTH_PATH, loginBody)
      .reply(200, loginReply)
      .get(POSITIONS_PATH)
      .query({ page: '0', size: '20' })
      .reply(function (this: nock.ReplyFnContext, uri: string): nock.ReplyFnResult {
        pages.push({ uri, headers: { ...this.req.headers } })
        return [500, { message: 'provider down' }]
      })

    const records: RecordedLog[] = []
    await withAdapter({ LOG_LEVEL: 'info' }, async (testAdapter) => {
      const { LoggerFactoryProvider } = await import('@chainlink/external-adapter-framework/util')
      LoggerFactoryProvider.set(recordLogCalls(LoggerFactoryProvider.get(), records))

      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(502)
      expect(response.json()).not.toHaveProperty('result')

      const output = JSON.stringify(records)

      // The production log keeps the alert about the failed request.
      expect(output).toContain('Request failed with status code 500')

      // It holds no bearer token and no request signing material.
      expect(output).not.toContain(loginReply.accessToken)
      expect(output).not.toContain('Amina-Signature')
      expect(output).not.toContain('Amina-Nonce')
      expect(output).not.toContain('Amina-Timestamp')

      expect(pages).toHaveLength(1)
      const headers = pages[0].headers
      expect(headers['authorization']).toBe(`Bearer ${loginReply.accessToken}`)
      expect(output).not.toContain(headers['amina-signature'])
      expect(output).not.toContain(headers['amina-nonce'])
      expect(output).not.toContain(headers['amina-timestamp'])

      expect(response.json()).toMatchSnapshot()
    })
  })

  it('returns a framework 404 for an unknown endpoint', async () => {
    await withAdapter({}, async (testAdapter) => {
      const response = await testAdapter.request({ endpoint: 'not-an-endpoint' })
      expect(response.statusCode).toBe(404)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
