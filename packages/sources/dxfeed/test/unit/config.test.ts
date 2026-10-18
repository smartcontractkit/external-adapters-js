import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import {
  buildAdapterConfig,
  config,
  DXLINK_AUTH_CENSOR_KEY,
  missingWsCredentials,
  REST_API_ENDPOINT_DEFAULT,
  validateWsApiEndpoint,
  wsEnvInputValidationError,
} from '../../src/config'
import quoteEventSymbols from '../../src/config/quoteSymbols.json'
import { dxLinkConnectionOptions } from '../../src/dxlink/protocol'
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
    // setEnvVariables only ASSIGNS snapshot keys — a key added inside this block
    // (e.g. ALLOW_PLAINTEXT_WS_TEST) would otherwise leak into the rest of the
    // file and silently enable the plaintext-ws gate for later proving tests
    for (const key of Object.keys(process.env)) {
      if (!(key in oldEnv)) {
        delete process.env[key]
      }
    }
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

  it('exposes all four spec env vars with their loaded values after initialize (spec environment_variables: API_USERNAME, API_PASSWORD, WS_API_ENDPOINT, API_ENDPOINT)', () => {
    const API_ENDPOINT = 'https://rest.fake.test/webservice/rest'
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT, API_ENDPOINT }, () => {
      const settings = config.settings as unknown as Record<string, unknown>
      expect(settings.API_USERNAME).toBe(CREDENTIALS.API_USERNAME)
      expect(settings.API_PASSWORD).toBe(CREDENTIALS.API_PASSWORD)
      expect(settings.WS_API_ENDPOINT).toBe(DXLINK_ENDPOINT)
      expect(settings.API_ENDPOINT).toBe(API_ENDPOINT)
    })
  })

  it('admits no unknown env var into the settings surface: a stray variable in the environment neither appears in the config nor affects startup', () => {
    withSettings(
      {
        ...CREDENTIALS,
        // The loopback test-bridge URL: with the test-only flag set, this is
        // the one admitted ws:// shape (round-2 plan item 1 hard-fails the
        // flag against a non-loopback host)
        WS_API_ENDPOINT: LOOPBACK_ENDPOINT,
        // The env var the spec does not declare (the deleted config drift) —
        // setting it must have no effect on the adapter's config surface
        ALLOW_INSECURE_LOOPBACK_WS: 'true',
        // The adapter-owned plaintext-test gate (plan item 1) is likewise read
        // from the process environment by the validate fn, never a settings key
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      },
      () => {
        expect(Object.keys(settingsDefinition()).sort()).toEqual(SPEC_ENV_VARS)
        expect(config.settings as unknown as Record<string, unknown>).not.toHaveProperty(
          'ALLOW_INSECURE_LOOPBACK_WS',
        )
        expect(config.settings as unknown as Record<string, unknown>).not.toHaveProperty(
          'ALLOW_PLAINTEXT_WS_TEST',
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

describe('WS credential triple is startup-required (spec environment_variables: API_USERNAME, API_PASSWORD and WS_API_ENDPOINT are each required:true — the plan CONF-ENV-MISMATCH proving test: startup fails when any of the three is missing)', () => {
  const STARTUP_ENV = { ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }

  it('builds the config with all four env vars set', () => {
    withSettings({ ...STARTUP_ENV, API_ENDPOINT: 'https://rest.fake.test/webservice/rest' }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })

  it('fails startup when API_USERNAME is missing', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_USERNAME/),
    )
  })

  it('fails startup when API_PASSWORD is missing', () => {
    withSettings(
      {
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_PASSWORD/),
    )
  })

  it('fails startup when WS_API_ENDPOINT is missing', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: undefined }, () =>
      expect(() => config.validate()).toThrow(/WS_API_ENDPOINT/),
    )
  })

  it('declares the three WS settings required:true and API_ENDPOINT optional', () => {
    const definitions = settingsDefinition() as Record<string, { required: boolean }>
    expect(definitions['API_USERNAME'].required).toBe(true)
    expect(definitions['API_PASSWORD'].required).toBe(true)
    expect(definitions['WS_API_ENDPOINT'].required).toBe(true)
    // API_ENDPOINT omits the required key entirely (the framework treats an
    // absent flag as optional)
    expect(definitions['API_ENDPOINT'].required).toBeFalsy()
  })

  it('a WS-transport request still hits the request-time env gate (defense-in-depth wsEnvInputValidationError)', () => {
    for (const endpoint of [priceEndpoint, stockQuotesEndpoint]) {
      const error = endpoint.customInputValidation?.(wsRequest, {} as any)
      expect(error?.statusCode).toBe(400)
      expect(error?.message).toContain('API_USERNAME')
    }
    const helperError = wsEnvInputValidationError({} as any)
    expect(helperError?.statusCode).toBe(400)
    expect(helperError?.message).toContain('API_USERNAME')
  })

  it('startup still rejects a WS_API_ENDPOINT value that fails the breaking-change URL checks (all validation errors are reported together)', () => {
    withSettings(
      {
        ...CREDENTIALS,
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

  it('accepts the framework mock-socket test-bridge URL only under the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag (the integration-test setup sets exactly this flag)', () => {
    // The WS integration suites serve the dxLink mock on the framework's
    // ws:// loopback test support and hand the URL to the adapter through
    // WS_API_ENDPOINT; the flag admits the plaintext scheme
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT, ALLOW_PLAINTEXT_WS_TEST: 'true' },
      () => expect(() => config.validate()).not.toThrow(),
    )
    // Without the flag the same value fails startup (no NODE_ENV downgrade path)
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT }, () =>
      expect(() => config.validate()).toThrow(/wss:\/\//),
    )
  })
})

describe('WS_API_ENDPOINT scheme gate (plan item 1: the transport sends the Basic Authorization header on the handshake, so any scheme other than wss:// is rejected at startup; ws:// only when the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag is set AND the host is loopback)', () => {
  it('rejects ws:// on a non-loopback host with or without the flag — with the flag, the round-2 hard failure names the flag misuse', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint('ws://fake-endpoint.invalid/dxlink-chainlink')).toContain(
        'wss://',
      ),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
        'ALLOW_PLAINTEXT_WS_TEST',
      ),
    )
  })

  it('rejects ws:// on a loopback host without the flag — including when NODE_ENV=test (a process-wide test-mode setting cannot enable plaintext credentials)', () => {
    withEnvVar('NODE_ENV', 'test', () =>
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toContain('wss://'),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('accepts ws://127.0.0.1 (and the other loopback hosts) ONLY under ALLOW_PLAINTEXT_WS_TEST=true — the framework mock-socket test bridge', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () => {
      expect(validateWsApiEndpoint('ws://127.0.0.1:9090/dxlink-chainlink')).toBe('')
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe('')
      expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toBe('')
    })
  })

  it('accepts the wss:// dxLink endpoint when the flag is unset; the flag set against a non-loopback host hard-fails even for wss:// (round-2 plan item 1: the flag is test-only)', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint('wss://dxlink-provider.fake.test/dxlink-chainlink')).toBe(''),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('wss://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
        'ALLOW_PLAINTEXT_WS_TEST',
      ),
    )
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
 * Runs fn with one env var pinned (and restored afterwards). The ws:// loopback
 * allowance keys off the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag (plan item
 * 1) — read directly by the validate fn, never a declared settings key.
 */
const withEnvVar = (name: string, value: string | undefined, fn: () => void): void => {
  const oldEnv = process.env[name]
  try {
    if (value === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = value
    }
    fn()
  } finally {
    if (oldEnv === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = oldEnv
    }
  }
}

describe('ws:// acceptance is scoped to the test-run loopback bridge (plan item 1 proving tests, round 2)', () => {
  it('a plaintext ws:// endpoint on a NON-loopback host fails startup validation with or without the flag (with the flag: the round-2 hard failure names the flag misuse)', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
        'wss://',
      ),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('ws://dxlink-provider.fake.test/dxlink-chainlink')).toContain(
        'ALLOW_PLAINTEXT_WS_TEST',
      ),
    )
  })

  it('a plaintext ws:// endpoint on a loopback host passes ONLY under ALLOW_PLAINTEXT_WS_TEST=true; NODE_ENV=test alone fails', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe(''),
    )
    withEnvVar('NODE_ENV', 'test', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('startup REJECTS ALLOW_PLAINTEXT_WS_TEST=true together with a non-loopback ws:// endpoint (round-2 hard startup failure: a copied test env file must fail the boot loudly)', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: 'ws://dxlink-provider.fake.test/dxlink-chainlink',
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      },
      () => expect(() => config.validate()).toThrow(/ALLOW_PLAINTEXT_WS_TEST/),
    )
  })

  it('startup ACCEPTS ALLOW_PLAINTEXT_WS_TEST=true with ws://127.0.0.1 (the mock-socket test bridge)', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: 'ws://127.0.0.1:9090/dxlink-chainlink',
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('startup REJECTS ws:// without the flag, loopback or not', () => {
    for (const endpoint of [
      'ws://127.0.0.1:9090/dxlink-chainlink',
      'ws://dxlink-provider.fake.test/dxlink-chainlink',
    ]) {
      withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: endpoint }, () =>
        expect(() => config.validate()).toThrow(/wss:\/\//),
      )
    }
  })

  it('the test-only flag set against a NON-loopback host hard-fails startup EVEN FOR wss:// (defence in depth on top of the loopback check)', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      },
      () => expect(() => config.validate()).toThrow(/ALLOW_PLAINTEXT_WS_TEST/),
    )
  })

  it('wss:// stays accepted whenever the test-only flag is unset', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe(''),
    )
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
    // framework builds the log-censoring list from exactly those flags at the
    // ONE call site it consumes: config.buildCensorList() inside
    // adapter.initialize().
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      config.buildCensorList()
      const censorList = CensorList.getAll()
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

  it('censors the EXACT Basic Authorization header value that dxLinkConnectionOptions sends (plan item 3 proving test: the censor list handed to the framework at its real call site contains the base64 Authorization value — the censored string and the sent string cannot drift)', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      // The value the WS handshake actually sends (spec handshake_header:
      // "Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>")
      const sent = dxLinkConnectionOptions(CREDENTIALS).headers.Authorization
      expect(sent).toBe(`Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`)

      // The framework-consumed call site (adapter.initialize() runs exactly
      // this) registers exactly that value — base64 is reversible, so an
      // uncensored connection-options log would leak decodable credentials
      config.buildCensorList()
      const authEntry = CensorList.getAll().find(({ key }) => key === DXLINK_AUTH_CENSOR_KEY)
      expect(authEntry).toBeDefined()
      expect(authEntry?.value.test(sent)).toBe(true)

      // And the registered pattern redacts the header out of a serialised
      // connection-options payload (what a log line would carry)
      const logged = JSON.stringify(dxLinkConnectionOptions(CREDENTIALS))
      expect(logged).toContain(sent)
      expect(logged.replace(authEntry!.value, '[REDACTED]')).not.toContain(sent)
    })
  })

  it('re-registers the Authorization entry on every buildCensorList call — the framework builder replaces the static list, so the append must survive repeated invocations exactly once', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      for (let call = 1; call <= 2; call++) {
        config.buildCensorList()
        const authEntries = CensorList.getAll().filter(({ key }) => key === DXLINK_AUTH_CENSOR_KEY)
        expect(authEntries).toHaveLength(1)
        const sent = dxLinkConnectionOptions(CREDENTIALS).headers.Authorization
        expect(authEntries[0].value.test(sent)).toBe(true)
      }
    })
  })

  it('masks both sensitive values in serialised config output (plan buildcensorlist-subclass-override proving test: the framework-consumed censor list redacts them)', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      // The censor list carries an entry per sensitive dxfeed setting
      config.buildCensorList()
      const censorList = CensorList.getAll()
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

  it('grep guard: the dead standalone censorList() accessor stays deleted — no uninvoked accessor may claim credential censoring (round-2 plan item 3)', () => {
    const offenders = sourceFiles(path.resolve(__dirname, '../../src')).filter((file) =>
      /export const censorList\b/.test(fs.readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
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
