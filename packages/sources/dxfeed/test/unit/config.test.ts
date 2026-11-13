/**
 * Config env-surface tests. WS vars are optional at AdapterConfig level so the
 * REST transport starts standalone.
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'

const VALID_WS_URL = 'wss://ws.example.test/dxlink'
const REST_DEFAULT = 'https://tools.dxfeed.com/webservice/rest'
const WS_ENV_VARS = ['WS_API_ENDPOINT', 'API_USERNAME', 'API_PASSWORD', 'API_ENDPOINT']

const setValidEnv = (): void => {
  process.env.WS_API_ENDPOINT = VALID_WS_URL
  process.env.API_USERNAME = 'dxfeed-user'
  process.env.API_PASSWORD = 'dxfeed-pass'
  delete process.env.API_ENDPOINT
  delete process.env.WS_HEARTBEAT_INTERVAL_MS
}

const clearWsEnv = (): void => {
  WS_ENV_VARS.forEach((name) => delete process.env[name])
}

type FreshConfig = {
  initialize: () => void
  validate: () => void
  settings: Record<string, unknown>
}

const importFreshConfig = async (): Promise<FreshConfig> => {
  Object.keys(require.cache)
    .filter((key) => key.includes('/dxfeed/src/'))
    .forEach((key) => delete require.cache[key])
  return (await import('../../src/config')).config as FreshConfig
}

describe('dxfeed config env surface', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    LoggerFactoryProvider.set()
  })

  afterAll(() => setEnvVariables(oldEnv))

  it('starts REST standalone without WS env vars', async () => {
    clearWsEnv()
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    expect(config.settings.WS_API_ENDPOINT ?? null).toBeNull()
  })

  it('accepts a dxLink URL and pins the 30s heartbeat', async () => {
    setValidEnv()
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    expect(config.settings.WS_API_ENDPOINT).toBe(VALID_WS_URL)
    expect(config.settings.API_ENDPOINT).toBe(REST_DEFAULT)
    expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(30000)
  })

  it.each([
    ['wss://user:pass@ws.example.test/dxlink', 'must not contain credentials'],
    ['wss://tools.dxfeed.com/chainlink/cometd', 'legacy cometd path'],
  ])('rejects %s', async (url, message) => {
    setValidEnv()
    process.env.WS_API_ENDPOINT = url
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow(message)
  })
})
