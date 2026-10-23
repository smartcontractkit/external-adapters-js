/**
 * Config env-surface tests — OPDATA-9200 spec, external_adapter_specifications
 * .environment_variables. Asserts the adapter config contract, never an
 * implementation detail:
 *
 * WS_API_ENDPOINT / API_USERNAME / API_PASSWORD are required=false at
 * AdapterConfig level (spec environment_variables table): the REST
 * transport starts standalone
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'

const VALID_WS_URL = 'wss://tools.dxfeed.com/dxlink-chainlink'
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

// Fresh src modules per test so env changes are re-read from scratch — WITHOUT
// jest.resetModules(), which forks the framework module graph (the logger
// factory singleton and the Adapter class identity must stay shared with the
// test graph).
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
    // The restored incumbent API_ENDPOINT demo-warning logs from the config
    // validate fn; the real server sets the logger factory in
    // adapter.initialize() before any logging. These tests construct the
    // AdapterConfig standalone, so mirror that bootstrap here (default
    // factory, no-arg set()).
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
      // No WS endpoint configured: unset reads as absent.
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
    // API_ENDPOINT is optional with the spec default; the REST transport is
    // unchanged by the migration.
    expect(config.settings.API_ENDPOINT).toBe(REST_DEFAULT)
    // stock_quotes keepalive interval_seconds 30.
    expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(30000)
  })

  describe('environment_variables flag table (spec: external_adapter_specifications.environment_variables)', () => {
    // Each case asserts the spec table's required/sensitive/default columns
    // through the config's public setting-debug surface, which reads the
    // adapter's setting definitions (the startup contract, not runtime data).
    // All four vars are required=false: the REST transport must start without
    // the WS surface; the WS requirement is enforced per-request only.
    const assertFlags = async (
      name: string,
      flags: { required: boolean; sensitive: boolean },
      defaultValue?: unknown,
    ): Promise<void> => {
      setValidEnv()
      const config = await importFreshConfig()
      config.initialize()
      const details = config.getSettingDebugDetails(name)
      expect(details.required).toBe(flags.required)
      expect(details.sensitive).toBe(flags.sensitive)
      if (defaultValue !== undefined) {
        expect(details.default).toEqual(defaultValue)
      }
    }

    it('WS_API_ENDPOINT: required=false, sensitive=true, no default (unset is undefined)', async () => {
      await assertFlags('WS_API_ENDPOINT', { required: false, sensitive: true })
    })

    it('API_USERNAME: required=false, sensitive=false', async () => {
      await assertFlags('API_USERNAME', { required: false, sensitive: false })
    })

    it('API_PASSWORD: required=false, sensitive=true (credential censoring surface)', async () => {
      await assertFlags('API_PASSWORD', { required: false, sensitive: true })
    })

    it('API_ENDPOINT: required=false, sensitive=false, defaults to the unchanged REST URL', async () => {
      await assertFlags('API_ENDPOINT', { required: false, sensitive: false }, REST_DEFAULT)
    })
  })

  it('keeps an explicitly set API_ENDPOINT', async () => {
    setValidEnv()
    process.env.API_ENDPOINT = 'https://custom-rest.example.com'
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    expect(config.settings.API_ENDPOINT).toBe('https://custom-rest.example.com')
  })

  it('drops the API_NAME_* variablePlaceholder surface and the getApiConfig helper', async () => {
    setValidEnv()
    const config = await importFreshConfig()
    expect(() => {
      config.initialize()
      config.validate()
    }).not.toThrow()
    // dxFeed uses one flat credential pair; the per-apiName placeholder
    // machinery has no call site after the migration.
    expect((config.settings as any).API_NAME_API_URL).toBeUndefined()
    expect((config.settings as any).API_NAME_AUTH_HEADER).toBeUndefined()
    expect((config.settings as any).API_NAME_AUTH_HEADER_VALUE).toBeUndefined()
    expect((config as any).getApiConfig).toBeUndefined()
  })
})
