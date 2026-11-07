/**
 * Config env-surface tests for OPDATA-9200.
 * WS_API_ENDPOINT / API_USERNAME / API_PASSWORD are optional at AdapterConfig
 * level so the REST transport starts standalone.
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'

const VALID_WS_URL = 'wss://ws.example.test/dxlink'
const REST_DEFAULT = 'https://tools.dxfeed.com/webservice/rest'

// Every env var the WS surface needs, plus API_ENDPOINT so leaked values from
// earlier tests cannot reach a fresh adapter's REST settings.
const WS_ENV_VARS = ['WS_API_ENDPOINT', 'API_USERNAME', 'API_PASSWORD', 'API_ENDPOINT']

const setValidEnv = (): void => {
  process.env.WS_API_ENDPOINT = VALID_WS_URL
  process.env.API_USERNAME = 'dxfeed-user'
  process.env.API_PASSWORD = 'dxfeed-pass'
  delete process.env.API_ENDPOINT
  delete process.env.WS_HEARTBEAT_INTERVAL_MS
}

const clearWsEnv = (): void => {
  for (const name of WS_ENV_VARS) {
    delete process.env[name]
  }
}

// Fresh src modules per test so env changes are re-read without resetModules().
const clearSrcCache = (): void => {
  for (const key of Object.keys(require.cache)) {
    if (key.includes('/dxfeed/src/')) {
      delete require.cache[key]
    }
  }
}

const importFreshConfig = async (): Promise<any> => {
  clearSrcCache()
  return (await import('../../src/config')).config
}

describe('dxfeed config env surface', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // The config validator logs the demo warning; mirror the server's logger bootstrap.
    LoggerFactoryProvider.set()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
  })

  describe('REST transport starts standalone (spec: WS env vars required=false at AdapterConfig level)', () => {
    it('starts and validates with no WS_API_ENDPOINT, API_USERNAME or API_PASSWORD', async () => {
      clearWsEnv()
      const config = await importFreshConfig()
      expect(() => {
        config.initialize()
        config.validate()
      }).not.toThrow()
      expect(config.settings.WS_API_ENDPOINT ?? null).toBeNull()
    })
  })

  it('accepts a valid dxLink URL and applies the spec defaults', async () => {
    setValidEnv()
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    expect(config.settings.WS_API_ENDPOINT).toBe(VALID_WS_URL)
    // API_ENDPOINT is optional with the framework default; REST is unchanged.
    expect(config.settings.API_ENDPOINT).toBe(REST_DEFAULT)
    // Framework default: 10s, below the 60s dxLink timeout.
    expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(10000)
  })

  it('rejects a WS_API_ENDPOINT with embedded credentials', async () => {
    setValidEnv()
    process.env.WS_API_ENDPOINT = 'wss://user:pass@ws.example.test/dxlink'
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).toThrow(/must not contain credentials/)
  })
})
