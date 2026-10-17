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

  it('rejects a plaintext ws:// endpoint — the Basic credentials would cross the wire unencrypted', () => {
    // Spec data_source_base_url / usage.handshake_header: the endpoint is
    // wss:// and the Authorization: Basic header rides the handshake, so only
    // the encrypted scheme is acceptable
    expect(validateWsApiEndpoint('ws://example.com/dxlink-chainlink')).toContain('wss://')
  })

  it('accepts the wss:// dxLink endpoint', () => {
    expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe('')
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

  it('runs the validator at startup: a plaintext ws:// WS_API_ENDPOINT fails config.validate()', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: 'ws://example.com/dxlink-chainlink' }, () =>
      expect(() => config.validate()).toThrow(/wss:\/\//),
    )
  })
})

/**
 * Captures the warnings the config module's logger emits while
 * validateWsApiEndpoint runs directly. Same fresh-module isolation as
 * captureValidateWarnings below: the config module binds its logger on the
 * first log call, so the recording factory must be wired before the module
 * loads in the isolated registry.
 */
const withRecordingLogger = (fn: (validate: typeof validateWsApiEndpoint) => void): string[] => {
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
    const configModule = require('../../src/config') as typeof import('../../src/config')
    const { validateWsApiEndpoint: freshValidate } = configModule

    framework.LoggerFactoryProvider.set(recordingFactory)
    try {
      fn(freshValidate)
    } finally {
      framework.LoggerFactoryProvider.set()
    }
  })
  return warnings
}

describe('loopback ws:// opt-in gate (plan item 2: the loopback ws:// exemption requires ALLOW_INSECURE_LOOPBACK_WS; the warning states the restriction in the log itself)', () => {
  const runWithFlag = (value: string | undefined, fn: () => void): void => {
    const oldFlag = process.env.ALLOW_INSECURE_LOOPBACK_WS
    try {
      if (value === undefined) {
        delete process.env.ALLOW_INSECURE_LOOPBACK_WS
      } else {
        process.env.ALLOW_INSECURE_LOOPBACK_WS = value
      }
      fn()
    } finally {
      if (oldFlag === undefined) {
        delete process.env.ALLOW_INSECURE_LOOPBACK_WS
      } else {
        process.env.ALLOW_INSECURE_LOOPBACK_WS = oldFlag
      }
    }
  }

  it('rejects a ws:// loopback URL with the flag unset (default false: no explicit opt-in, no plaintext handshake) and emits no acceptance warning', () => {
    const warnings = withRecordingLogger((validate) => {
      runWithFlag(undefined, () => {
        expect(validate('ws://localhost:9090/dxlink-chainlink')).not.toBe('')
      })
    })
    // A rejected URL never becomes an accepted plaintext handshake
    expect(warnings).toHaveLength(0)
  })

  it('accepts a ws:// loopback URL with ALLOW_INSECURE_LOOPBACK_WS=true and emits exactly one warning that the credentials ride an unencrypted connection', () => {
    const warnings = withRecordingLogger((validate) => {
      runWithFlag('true', () => {
        expect(validate('ws://localhost:9090/dxlink-chainlink')).toBe('')
      })
    })
    expect(warnings).toHaveLength(1)
    // The warning states the Basic auth credentials cross the wire unencrypted
    expect(warnings[0]).toMatch(/encrypt|plaintext|cleartext/i)
  })

  it('still rejects a non-loopback ws:// endpoint with no exemption (acceptance behavior unchanged)', () => {
    const warnings = withRecordingLogger((validate) => {
      expect(validate('ws://example.com/dxlink-chainlink')).toContain('wss://')
    })
    // A rejected URL never becomes an accepted plaintext handshake
    expect(warnings).toHaveLength(0)
  })

  it('emits no warning for the encrypted wss:// dxLink endpoint', () => {
    const warnings = withRecordingLogger((validate) => {
      expect(validate(DXLINK_ENDPOINT)).toBe('')
    })
    expect(warnings).toHaveLength(0)
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
      API_ENDPOINT: 'https://custom.dxfeed.example.com/webservice/rest',
    })
    expect(warnings.some((w) => w.includes('Using demo endpoint'))).toBe(false)
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
