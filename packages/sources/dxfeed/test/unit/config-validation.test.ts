import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config, validateWsApiEndpoint } from '../../src/config'

LoggerFactoryProvider.set()

/**
 * Runs fn with the given env vars set and the config (re)initialized from
 * them. AdapterConfig.settingsDefinition is private in the pinned framework
 * (2.20.0), so startup behavior — including that the WS_API_ENDPOINT validator
 * is wired in — is asserted through the public initialize()/validate() surface.
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

/**
 * Runs fn with one env var pinned (and restored after): the plaintext-ws gate
 * reads the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag, and the plan's proving
 * test pins NODE_ENV to prove it no longer has any effect on the gate.
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
// Fake host (test_fake_urls): the provider host belongs only in src/config
const DXLINK_ENDPOINT = 'wss://dxlink.fake.test/dxlink-chainlink'

describe('WS_API_ENDPOINT validation (spec breaking_change_env_checks)', () => {
  it('rejects the deleted legacy cometd endpoint', () => {
    expect(validateWsApiEndpoint('wss://dxlink.fake.test/chainlink/cometd')).toContain('cometd')
  })

  it('rejects credentials embedded in the URL', () => {
    expect(validateWsApiEndpoint('wss://user:pass@dxlink.fake.test/dxlink-chainlink')).toContain(
      'credentials',
    )
  })

  it('accepts the wss:// dxLink endpoint', () => {
    expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe('')
  })

  it('accepts the framework mock-socket test-bridge URL when the adapter-owned ALLOW_PLAINTEXT_WS_TEST flag is set (the integration-test setup sets exactly this flag)', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe(''),
    )
  })

  it('runs the validator at startup: a cometd WS_API_ENDPOINT fails config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd' },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
  })

  it('runs the validator at startup: an endpoint with embedded credentials fails config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://user:pass@dxlink.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })

  it('admits ws://127.0.0.1 ONLY with ALLOW_PLAINTEXT_WS_TEST=true; NODE_ENV=test alone no longer enables plaintext credentials (plan item 1 proving test)', () => {
    const loopbackUrl = 'ws://127.0.0.1:9090/dxlink-chainlink'
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint(loopbackUrl)).toBe(''),
    )
    // A process-wide test-mode setting must NOT enable plaintext credentials:
    // the gate reads only the adapter-owned flag
    withEnvVar('NODE_ENV', 'test', () =>
      expect(validateWsApiEndpoint(loopbackUrl)).toContain('wss://'),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint(loopbackUrl)).toContain('wss://'),
    )
  })

  it('wss:// stays accepted while the plaintext flag is unset; the flag set against a non-loopback host hard-fails even for wss:// (round-2 plan item 1: the flag is test-only)', () => {
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', undefined, () =>
      expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe(''),
    )
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toContain('ALLOW_PLAINTEXT_WS_TEST'),
    )
  })
})

/**
 * Captures the warnings a FRESH config module emits while validate() runs.
 * The config module binds its logger on the first log call, so each capture
 * builds the config in an isolated module registry wired to a recording
 * factory — that keeps the two cases (default vs custom API_ENDPOINT)
 * independent instead of sharing one logger instance.
 */
const captureValidateWarnings = (env: Record<string, string | undefined>): string[] => {
  const warnings: string[] = []
  const recordingFactory: LoggerFactory = {
    child: () => {
      const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
      const methods: Record<string, (...args: unknown[]) => void> = {}
      for (const level of levels) {
        methods[level] = (...args: unknown[]) => {
          if (level === 'warn') {
            warnings.push(args.map((arg) => String(arg)).join(' '))
          }
        }
      }
      return methods as unknown as ReturnType<LoggerFactory['child']>
    },
  }

  jest.isolateModules(() => {
    // The isolated registry holds fresh copies of the framework modules too,
    // so the recorder must be set on THAT registry's provider
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const framework = require('@chainlink/external-adapter-framework/util') as {
      LoggerFactoryProvider: typeof LoggerFactoryProvider
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { config: freshConfig } = require('../../src/config') as typeof import('../../src/config')

    framework.LoggerFactoryProvider.set(recordingFactory)
    const oldEnv = JSON.parse(JSON.stringify(process.env))
    try {
      for (const [name, value] of Object.entries(env)) {
        if (value === undefined) {
          delete process.env[name]
        } else {
          process.env[name] = value
        }
      }
      freshConfig.initialize()
      freshConfig.validate()
    } finally {
      // setEnvVariables only ASSIGNS snapshot keys — a key added inside this
      // block (e.g. ALLOW_PLAINTEXT_WS_TEST) would otherwise leak into the rest
      // of the file and silently enable the plaintext-ws gate for later tests
      for (const key of Object.keys(process.env)) {
        if (!(key in oldEnv)) {
          delete process.env[key]
        }
      }
      setEnvVariables(oldEnv)
      framework.LoggerFactoryProvider.set()
    }
  })
  return warnings
}

describe('demo REST endpoint startup warning (keep_untouched REST path: pre-migration behaviour)', () => {
  it('warns when API_ENDPOINT keeps the default demo REST endpoint', () => {
    // API_ENDPOINT: undefined -> the src/config default (the real provider REST
    // host) applies; test_fake_urls keeps that host out of this file, so the
    // warning is asserted by its fixed 'Using demo endpoint' prefix
    const warnings = captureValidateWarnings({
      ...CREDENTIALS,
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
      API_ENDPOINT: undefined,
    })
    expect(warnings.some((w) => w.includes('Using demo endpoint'))).toBe(true)
  })

  it('does not warn when API_ENDPOINT is customized away from the demo default', () => {
    const warnings = captureValidateWarnings({
      ...CREDENTIALS,
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
      API_ENDPOINT: 'https://custom-rest.fake.test/webservice/rest',
    })
    expect(warnings.some((w) => w.includes('Using demo endpoint'))).toBe(false)
  })
})

describe('plaintext ws:// loopback acceptance warns loudly (round-2: a boot with real credentials on ws:// would send the Basic Authorization header unencrypted with no signal)', () => {
  it('emits the warning and passes validation for WS_API_ENDPOINT=ws://localhost under ALLOW_PLAINTEXT_WS_TEST=true', () => {
    // The adapter-owned flag admits the loopback ws:// acceptance, which logs
    // the plaintext-credential warning while validation still passes
    const warnings = captureValidateWarnings({
      ...CREDENTIALS,
      WS_API_ENDPOINT: 'ws://localhost:9090/dxlink-chainlink',
      ALLOW_PLAINTEXT_WS_TEST: 'true',
    })
    expect(warnings.some((w) => w.includes('plaintext ws://'))).toBe(true)
    withEnvVar('ALLOW_PLAINTEXT_WS_TEST', 'true', () =>
      expect(validateWsApiEndpoint('ws://localhost:9090/dxlink-chainlink')).toBe(''),
    )
  })

  it('emits no plaintext warning for the wss:// endpoint', () => {
    const warnings = captureValidateWarnings({
      ...CREDENTIALS,
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    })
    expect(warnings.some((w) => w.includes('plaintext ws://'))).toBe(false)
  })
})

describe('credential censoring (template config-credentials: mask API_PASSWORD and WS_API_ENDPOINT in logs)', () => {
  it('registers the sensitive API_PASSWORD and WS_API_ENDPOINT values in the framework censor list', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () => {
      config.buildCensorList()
      const censored = CensorList.getAll()

      // API_PASSWORD is sensitive: its value must be redactable from logs
      const passwordEntry = censored.find((entry) => entry.key === 'API_PASSWORD')
      expect(passwordEntry).toBeDefined()
      expect(passwordEntry?.value.test('dxfeed-pass')).toBe(true)

      // WS_API_ENDPOINT is sensitive: its value must be redactable from logs
      const endpointEntry = censored.find((entry) => entry.key === 'WS_API_ENDPOINT')
      expect(endpointEntry).toBeDefined()
      expect(endpointEntry?.value.test(DXLINK_ENDPOINT)).toBe(true)

      // API_USERNAME is explicitly non-sensitive and stays loggable
      expect(censored.find((entry) => entry.key === 'API_USERNAME')).toBeUndefined()
    })
  })
})
