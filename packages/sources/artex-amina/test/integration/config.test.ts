import nock from 'nock'

import {
  API_HOST_CUSTOM,
  API_HOST_PRODUCTION,
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
import { BASE_ENV, FIXED_NOW, importConfig, restoreEnv, setEnv, withAdapter } from './helpers'

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

  it('censors the password and the HMAC secret from trace logs', async () => {
    await withAdapter({}, async () => {
      const { default: CensorList } = await import(
        '@chainlink/external-adapter-framework/util/censor/censor-list'
      )
      const entries = CensorList.getAll()
      const values = new Map(entries.map((entry) => [entry.key, entry.value]))

      expect(values.has('AMINA_PASSWORD')).toBe(true)
      expect(values.has('AMINA_HMAC_SECRET')).toBe(true)
      expect(values.has('AMINA_USER_ID')).toBe(false)

      const trace = JSON.stringify({ username: userId, password, secret: hmacSecret })
      expect(
        trace.replace(values.get('AMINA_PASSWORD') as RegExp, '[PASSWORD REDACTED]'),
      ).not.toContain(password)
      expect(
        trace.replace(values.get('AMINA_HMAC_SECRET') as RegExp, '[SECRET REDACTED]'),
      ).not.toContain(hmacSecret)
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
