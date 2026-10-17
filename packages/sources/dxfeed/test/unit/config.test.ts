import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import {
  buildAdapterConfig,
  config,
  missingWsCredentials,
  REST_API_ENDPOINT_DEFAULT,
  validateWsApiEndpoint,
  wsEnvInputValidationError,
} from '../../src/config'
import { endpoint as priceEndpoint } from '../../src/endpoint/price'
import { endpoint as stockQuotesEndpoint } from '../../src/endpoint/stock-quotes'

// The pre-migration demo REST endpoint startup warning logs from the config
// validate fn, so the logger factory must be set before validate() runs
LoggerFactoryProvider.set()

/**
 * Runs fn with the given env vars set and the config (re)initialized from
 * them. Startup behavior is asserted through the public initialize()/validate()
 * surface plus the runtime settingsDefinition map (TS-private in the pinned
 * framework 2.20.0, but present on every AdapterConfig instance — the repo's
 * own packages/scripts generators read it through the same cast).
 */
const withSettings = (env: Record<string, string | undefined>, fn: () => void): void => {
  const oldEnv = JSON.parse(JSON.stringify(process.env))
  try {
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
    config.initialize()
    fn()
  } finally {
    setEnvVariables(oldEnv)
    config.initialize()
  }
}

const CREDENTIALS = { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }
// Fake host (test_fake_urls): the provider host belongs only in src/config
const DXLINK_ENDPOINT = 'wss://dxlink.fake.test/dxlink-chainlink'
// The framework mock-socket test bridge URL the WS integration tests inject
// through WS_API_ENDPOINT alone
const LOOPBACK_ENDPOINT = 'ws://localhost:9090/dxlink-chainlink'

/**
 * The spec environment_variables list — the ONLY env vars the adapter config
 * may declare (plan finding CONF-ENV-MISMATCH: the config surface must match
 * this set exactly).
 */
const SPEC_ENV_VARS = ['API_ENDPOINT', 'API_PASSWORD', 'API_USERNAME', 'WS_API_ENDPOINT']

/** The runtime settings-definition map of the AdapterConfig instance. */
const settingsDefinition = (): Record<string, unknown> =>
  (config as unknown as { settingsDefinition: Record<string, unknown> }).settingsDefinition

/** Recursively lists source files under src/ the grep guard scans. */
const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return sourceFiles(full)
    }
    return /\.(ts|tsx|js|mjs|cjs|json)$/.test(entry.name) ? [full] : []
  })

// The framework resolves requestContext.transportName (ws|rest) BEFORE calling
// customInputValidation, so a WS-path request is exactly a request whose
// resolved transport is "ws".
const wsRequest = { requestContext: { transportName: 'ws' } } as any

describe('config surface (plan CONF-ENV-MISMATCH: the spec lists four environment_variables and the config must match that set exactly)', () => {
  it('declares exactly API_USERNAME, API_PASSWORD, WS_API_ENDPOINT and API_ENDPOINT — no more, no fewer', () => {
    expect(Object.keys(settingsDefinition()).sort()).toEqual(SPEC_ENV_VARS)
  })

  it('admits no unknown env var into the settings surface: a stray variable in the environment neither appears in the config nor affects startup', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
        // The env var the spec does not declare (the deleted config drift) —
        // setting it must have no effect on the adapter's config surface
        ALLOW_INSECURE_LOOPBACK_WS: 'true',
      },
      () => {
        expect(Object.keys(settingsDefinition()).sort()).toEqual(SPEC_ENV_VARS)
        expect(config.settings as unknown as Record<string, unknown>).not.toHaveProperty(
          'ALLOW_INSECURE_LOOPBACK_WS',
        )
        expect(() => config.validate()).not.toThrow()
      },
    )
  })

  it('grep guard: no adapter source file references the unspecced env var', () => {
    const offenders = sourceFiles(path.resolve(__dirname, '../../src')).filter((file) =>
      fs.readFileSync(file, 'utf8').includes('ALLOW_INSECURE_LOOPBACK_WS'),
    )
    expect(offenders).toEqual([])
  })
})

describe('WS settings are startup-required (plan CONF-ENV-MISMATCH proving test: the spec environment_variables mark API_USERNAME, API_PASSWORD and WS_API_ENDPOINT required)', () => {
  const STARTUP_ENV = { ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }

  it('fails startup with a validation error naming API_USERNAME when it is unset', () => {
    withSettings({ ...STARTUP_ENV, API_USERNAME: undefined }, () =>
      expect(() => config.validate()).toThrow(/API_USERNAME/),
    )
  })

  it('fails startup with a validation error naming API_PASSWORD when it is unset', () => {
    withSettings({ ...STARTUP_ENV, API_PASSWORD: undefined }, () =>
      expect(() => config.validate()).toThrow(/API_PASSWORD/),
    )
  })

  it('fails startup with a validation error naming WS_API_ENDPOINT when it is unset', () => {
    withSettings({ ...STARTUP_ENV, WS_API_ENDPOINT: undefined }, () =>
      expect(() => config.validate()).toThrow(/WS_API_ENDPOINT/),
    )
  })

  it('passes startup when all three are set with a clean dxLink WS_API_ENDPOINT', () => {
    withSettings(STARTUP_ENV, () => expect(() => config.validate()).not.toThrow())
  })

  it('a REST-path price request is still not gated by the WS env checks (the checks key off the resolved transport, ws only)', () => {
    withSettings(STARTUP_ENV, () => {
      // The framework resolves transportName (rest) BEFORE customInputValidation;
      // the WS env checks only ever gate requests whose resolved transport is ws
      const restRequest = { requestContext: { transportName: 'rest' } } as any
      expect(
        priceEndpoint.customInputValidation?.(restRequest, config.settings as any),
      ).toBeUndefined()
    })
  })

  it('a WS request without credentials still fails at request time (wsEnvInputValidationError kept as defense-in-depth on the WS path)', () => {
    const error = wsEnvInputValidationError({} as any)
    expect(error?.statusCode).toBe(400)
    expect(error?.message).toContain('API_USERNAME')

    // Through both endpoints' customInputValidation on the ws path
    for (const endpoint of [priceEndpoint, stockQuotesEndpoint]) {
      const wsError = endpoint.customInputValidation?.(wsRequest, {} as any)
      expect(wsError?.statusCode).toBe(400)
      expect(wsError?.message).toContain('API_USERNAME')
    }
  })

  it('a WS_API_ENDPOINT containing /chainlink/cometd or ://user:pass@ is still rejected at startup (the breaking-change validate fns stay)', () => {
    withSettings(
      {
        ...STARTUP_ENV,
        WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd',
      },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
    withSettings(
      {
        ...STARTUP_ENV,
        WS_API_ENDPOINT: 'wss://user:pass@dxlink.fake.test/dxlink-chainlink',
      },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })
})

describe('WS-path request-time credential gate (spec breaking_change_env_checks: require API_USERNAME and API_PASSWORD to be set (WS paths))', () => {
  it('rejects a stock_quotes request without credentials with a validation error naming the pair', () => {
    // stock_quotes is WS-only: its customInputValidation repeats the
    // credential-pair check with a clear per-request error (defense-in-depth
    // under the startup-required settings surface)
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    } as any)
    expect(error?.message).toContain('API_USERNAME')
    expect(error?.message).toContain('API_PASSWORD')
  })

  it('accepts a WS-path request when the pair is set', () => {
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      ...CREDENTIALS,
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    } as any)
    expect(error).toBeUndefined()
  })

  it('fails the WS-path check when either one of the pair is unset', () => {
    expect(missingWsCredentials({})).toContain('API_USERNAME')
    expect(missingWsCredentials({ API_USERNAME: 'dxfeed-user' })).toContain('API_PASSWORD')
    expect(missingWsCredentials({ API_PASSWORD: 'dxfeed-pass' })).toContain('API_USERNAME')
    expect(missingWsCredentials({ API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' })).toBe(
      '',
    )
  })
})

describe('WS_API_ENDPOINT startup checks (spec breaking_change_env_checks)', () => {
  it('rejects a WS_API_ENDPOINT containing the legacy cometd path', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd' },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
  })

  it('rejects a WS_API_ENDPOINT carrying embedded ://user:pass@ credentials', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://user:pass@dxlink.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })

  it('accepts a clean wss:// dxLink endpoint', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })

  it('accepts the framework mock-socket test-bridge URL injected through WS_API_ENDPOINT ONLY (no opt-in env var exists: the spec declares four env vars and the tests bind no extra one)', () => {
    // The WS integration suites serve the dxLink mock on the framework's
    // ws:// loopback test support and hand the URL to the adapter through
    // WS_API_ENDPOINT alone — startup must accept exactly that
    expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).toBe('')
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('WS_API_ENDPOINT scheme gate (round-2 security: a plaintext ws:// endpoint sends the Basic Authorization credentials unencrypted)', () => {
  it('rejects ws://dxlink-provider.fake.test/dxlink-chainlink with a startup error naming the required wss:// scheme and the plaintext-credential risk', () => {
    const error = validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')
    expect(error).toContain('wss://')
    expect(error).toContain('ws://')
    expect(error).toMatch(/plaintext|unencrypted/i)
    // The sensitive endpoint value is not echoed back into the error
    expect(error).not.toContain('dxlink-provider.fake.test')
  })

  it('fails startup when WS_API_ENDPOINT points at a plaintext ws:// provider endpoint', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'ws://dxlink-provider.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/wss/),
    )
  })

  it('accepts the spec wss:// dxLink endpoint (spec data_source_base_url)', () => {
    expect(validateWsApiEndpoint('wss://dxlink-provider.fake.test/dxlink-chainlink')).toBe('')
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxlink-provider.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('accepts ws:// loopback URLs so the mock-server test bridge keeps working (127.0.0.1, localhost, ::1)', () => {
    expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toBe('')
    expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe('')
    expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toBe('')
  })

  it('still rejects ws:// on a non-loopback hostname other than the provider host too (the allowance is loopback-only)', () => {
    expect(validateWsApiEndpoint('ws://dxlink.fake.test/dxlink-chainlink')).toContain('wss://')
  })
})

/**
 * Runs fn with NODE_ENV set to the given value, restoring it afterwards. The
 * ws:// loopback allowance keys off NODE_ENV — the existing process signal, no
 * new config key (round-2).
 */
const withNodeEnv = (nodeEnv: string | undefined, fn: () => void): void => {
  const oldNodeEnv = process.env.NODE_ENV
  try {
    if (nodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = nodeEnv
    }
    fn()
  } finally {
    if (oldNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = oldNodeEnv
    }
  }
}

describe('ws:// loopback allowance is a test-run-only bypass (round-2: a deployed boot pointed at ws:// would send the Basic auth header in plaintext)', () => {
  it('accepts ws://localhost when NODE_ENV is test', () => {
    withNodeEnv('test', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe(''),
    )
  })

  it('rejects ws://localhost when NODE_ENV is production', () => {
    withNodeEnv('production', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('rejects ws://localhost when NODE_ENV is unset', () => {
    withNodeEnv(undefined, () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('rejects the other loopback hosts outside a test run too — the allowance is test-run-scoped, not just loopback-scoped', () => {
    withNodeEnv('production', () => {
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toContain('wss://')
      expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toContain('wss://')
    })
  })

  it('wss:// stays accepted in all modes', () => {
    for (const nodeEnv of ['test', 'production', undefined]) {
      withNodeEnv(nodeEnv, () => expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe(''))
    }
  })
})

describe('AdapterConfig construction and the censor list (round-2: no double registration of sensitive values)', () => {
  it('two AdapterConfig constructions in the same process leave exactly one censor entry for API_PASSWORD and one for WS_API_ENDPOINT after each construction', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      const entriesFor = (key: string): number =>
        CensorList.getAll().filter(({ key: entryKey }) => entryKey === key).length

      for (let construction = 1; construction <= 2; construction++) {
        // Each construction reads the environment through its own initialize()
        // (the framework populates settings there, and buildCensorList
        // registers the sensitive settings' values)
        const built = buildAdapterConfig()
        built.initialize()
        built.buildCensorList()
        expect(entriesFor('API_PASSWORD')).toBe(1)
        expect(entriesFor('WS_API_ENDPOINT')).toBe(1)
      }
    })
  })
})

describe('REST contract untouched by the migration (spec environment_variables.API_ENDPOINT)', () => {
  it('keeps the API_ENDPOINT default at the REST webservice URL', () => {
    withSettings({ API_ENDPOINT: undefined }, () =>
      // The default value itself lives only in src/config (test_fake_urls)
      expect(config.settings.API_ENDPOINT).toBe(REST_API_ENDPOINT_DEFAULT),
    )
  })
})

describe('credential censoring (spec: WS_API_ENDPOINT and API_PASSWORD are sensitive)', () => {
  it('never embeds the password or the endpoint value in a breaking-change error message', () => {
    const withCreds = {
      WS_API_ENDPOINT: 'wss://dxfeed-user:dxfeed-pass@dxlink.fake.test/chainlink/cometd',
      API_USERNAME: 'dxfeed-user',
      API_PASSWORD: 'dxfeed-pass',
    }

    // The cometd rejection fires first; whichever check rejects, neither the
    // password nor the sensitive endpoint value may leak into the message
    const error = wsEnvInputValidationError(withCreds)
    expect(error).toBeDefined()
    expect(error?.message).toMatch(/cometd/)
    expect(error?.message).not.toContain('dxfeed-pass')
    expect(error?.message).not.toContain(withCreds.WS_API_ENDPOINT)

    // The embedded-credential rejection censors the values too
    const embedded = wsEnvInputValidationError({
      ...withCreds,
      WS_API_ENDPOINT: 'wss://dxfeed-user:dxfeed-pass@dxlink.fake.test/dxlink-chainlink',
    })
    expect(embedded?.message).toMatch(/credentials/)
    expect(embedded?.message).not.toContain('dxfeed-pass')

    // And the validate fn used at startup behaves the same
    const startup = validateWsApiEndpoint(
      'wss://dxfeed-user:dxfeed-pass@dxlink.fake.test/chainlink/cometd',
    )
    expect(startup).toMatch(/cometd/)
    expect(startup).not.toContain('dxfeed-pass')
  })

  it('puts the sensitive settings (API_PASSWORD, WS_API_ENDPOINT) on the log censor list and leaves the others off it', () => {
    // Spec environment_variables: API_PASSWORD and WS_API_ENDPOINT are
    // sensitive=true; API_USERNAME and API_ENDPOINT are sensitive=false. The
    // framework builds the log-censoring list from exactly those flags.
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      const censorList = config.buildCensorList()
      const censoredKeys = censorList.map(({ key }) => key)

      expect(censoredKeys).toContain('API_PASSWORD')
      expect(censoredKeys).toContain('WS_API_ENDPOINT')
      expect(censoredKeys).not.toContain('API_USERNAME')
      expect(censoredKeys).not.toContain('API_ENDPOINT')

      // Each censor entry matches the real sensitive value, so the value is
      // what gets redacted from logs
      const passwordEntry = censorList.find(({ key }) => key === 'API_PASSWORD')
      expect(passwordEntry?.value.test(CREDENTIALS.API_PASSWORD)).toBe(true)
      const endpointEntry = censorList.find(({ key }) => key === 'WS_API_ENDPOINT')
      expect(endpointEntry?.value.test(DXLINK_ENDPOINT)).toBe(true)
    })
  })
})

// The framework pin (spec framework_version 2.20.0) is proven in
// test/unit/adapter.test.ts — the plan's round1-scaffold proving test.
