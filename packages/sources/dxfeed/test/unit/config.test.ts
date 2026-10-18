import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import {
  buildAdapterConfig,
  censorList as censorListEntries,
  config,
  missingWsCredentials,
  REST_API_ENDPOINT_DEFAULT,
  validateWsApiEndpoint,
  wsEnvInputValidationError,
} from '../../src/config'
import quoteEventSymbols from '../../src/config/quoteSymbols.json'
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

describe('WS credential triple is NOT startup-required (plan ws-env-triple-required-at-startup: the spec breaking_change_env_checks scope the credential requirement to WS paths — a REST-only pod boots with only API_ENDPOINT set; owner decision rest_transport_scope=keep_untouched)', () => {
  const STARTUP_ENV = { ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }

  it('initialises with ONLY API_ENDPOINT set and no WS triple (the REST-only boot)', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: undefined,
        API_ENDPOINT: 'https://rest.fake.test/webservice/rest',
      },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('still initialises with the full WS triple set (the WS paths keep working)', () => {
    withSettings(STARTUP_ENV, () => expect(() => config.validate()).not.toThrow())
  })

  it('declares the three WS settings required:false (the WS requirement moved to request time)', () => {
    const definitions = settingsDefinition() as Record<string, { required: boolean }>
    expect(definitions['API_USERNAME'].required).toBe(false)
    expect(definitions['API_PASSWORD'].required).toBe(false)
    expect(definitions['WS_API_ENDPOINT'].required).toBe(false)
  })

  it('a WS-transport request in the REST-only state returns the env validation error (the request-time gate wsEnvInputValidationError)', () => {
    for (const endpoint of [priceEndpoint, stockQuotesEndpoint]) {
      const error = endpoint.customInputValidation?.(wsRequest, {} as any)
      expect(error?.statusCode).toBe(400)
      expect(error?.message).toContain('API_USERNAME')
    }
    const helperError = wsEnvInputValidationError({} as any)
    expect(helperError?.statusCode).toBe(400)
    expect(helperError?.message).toContain('API_USERNAME')
  })

  it('startup still rejects a WS_API_ENDPOINT value that fails the breaking-change URL checks while the credential pair is unset (all validation errors are reported together)', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd',
      },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
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

describe('WS_API_ENDPOINT scheme gate (plan ws-plaintext-endpoint-accepted: the transport sends the Basic Authorization header on the handshake, so any scheme other than wss:// is rejected at startup; ws:// only when NODE_ENV is test AND the host is loopback)', () => {
  it('rejects ws://example.com in a non-test NODE_ENV', () => {
    withNodeEnv('production', () =>
      expect(validateWsApiEndpoint('ws://example.com/dxlink-chainlink')).toContain('wss://'),
    )
    withNodeEnv(undefined, () =>
      expect(validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
        'wss://',
      ),
    )
  })

  it('rejects ws:// even on a loopback host outside NODE_ENV=test', () => {
    withNodeEnv('production', () =>
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('accepts ws://127.0.0.1 (and the other loopback hosts) ONLY under NODE_ENV=test — the framework mock-socket test bridge', () => {
    withNodeEnv('test', () => {
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toBe('')
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe('')
      expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toBe('')
    })
  })

  it('accepts the wss:// dxLink endpoint in every NODE_ENV mode (spec data_source_base_url)', () => {
    for (const nodeEnv of ['test', 'production', undefined]) {
      withNodeEnv(nodeEnv, () =>
        expect(validateWsApiEndpoint('wss://dxlink-provider.fake.test/dxlink-chainlink')).toBe(''),
      )
    }
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxlink-provider.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('still rejects the cometd path and embedded credentials at startup (the two spec-declared checks stay)', () => {
    expect(validateWsApiEndpoint('wss://dxlink.fake.test/chainlink/cometd')).toContain('cometd')
    expect(validateWsApiEndpoint('wss://user:pass@dxlink.fake.test/dxlink-chainlink')).toContain(
      'credentials',
    )
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

describe('ws:// acceptance is scoped to the test-run loopback bridge (plan ws-plaintext-endpoint-accepted proving tests)', () => {
  it('a plaintext ws:// endpoint on a NON-loopback host fails startup validation in every NODE_ENV mode', () => {
    for (const nodeEnv of ['test', 'production', undefined]) {
      withNodeEnv(nodeEnv, () =>
        expect(validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
          'wss://',
        ),
      )
    }
  })

  it('a plaintext ws:// endpoint on a loopback host passes ONLY under NODE_ENV=test', () => {
    withNodeEnv('test', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe(''),
    )
    withNodeEnv('production', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
    withNodeEnv(undefined, () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
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
      const censorList = censorListEntries()
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

  it('masks both sensitive values in serialised config output (plan buildcensorlist-subclass-override proving test: the wrapper appends the dxfeed censor entries and the built list redacts them)', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      // The censor list carries an entry per sensitive dxfeed setting
      const censorList = censorListEntries()
      expect(censorList.map(({ key }) => key)).toEqual(
        expect.arrayContaining(['API_PASSWORD', 'WS_API_ENDPOINT']),
      )

      // Applying the built entries to the serialised config output masks both
      // sensitive values
      const serialised = JSON.stringify(config.settings)
      expect(serialised).toContain('dxfeed-pass')
      expect(serialised).toContain(DXLINK_ENDPOINT)
      let masked = serialised
      for (const { value } of censorList) {
        masked = masked.replace(
          new RegExp(value.source, value.flags.includes('g') ? value.flags : `${value.flags}g`),
          '***',
        )
      }
      expect(masked).not.toContain('dxfeed-pass')
      expect(masked).not.toContain(DXLINK_ENDPOINT)
    })
  })
})

describe('adapter scaffold (plan round1-scaffold proving test)', () => {
  it('pins @chainlink/external-adapter-framework at >= 2.20.0 (spec framework_version 2.20.0)', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    const version = packageJson.dependencies['@chainlink/external-adapter-framework']
    expect(version).toBeDefined()
    const [major, minor] = version.split('.').map(Number)
    expect(major > 2 || (major === 2 && minor >= 20)).toBe(true)
  })

  it('resolves the price endpoint defaultTransport to rest (spec endpoints.price.default_transport)', () => {
    expect(priceEndpoint.defaultTransport).toBe('rest')
  })

  it('loads config/quoteSymbols.json unchanged (owner decision rest_transport_scope = keep_untouched)', () => {
    expect(quoteEventSymbols).toEqual({ 'USO/USD:AFX': true })
  })
})

// The framework pin (spec framework_version 2.20.0) is also proven in
// test/unit/adapter.test.ts.
