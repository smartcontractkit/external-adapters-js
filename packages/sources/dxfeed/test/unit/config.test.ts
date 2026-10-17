import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import {
  config,
  missingWsCredentials,
  REST_API_ENDPOINT_DEFAULT,
  validateWsApiEndpoint,
  wsEnvInputValidationError,
} from '../../src/config'
import { endpoint as stockQuotesEndpoint } from '../../src/endpoint/stock-quotes'

// The pre-migration demo REST endpoint startup warning logs from the config
// validate fn, so the logger factory must be set before validate() runs
LoggerFactoryProvider.set()

/**
 * Runs fn with the given env vars set and the config (re)initialized from
 * them. AdapterConfig.settingsDefinition is private in the pinned framework
 * (2.20.0), so startup behavior is asserted through the public
 * initialize()/validate() surface.
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
const LOOPBACK_ENDPOINT = 'ws://localhost:9090/dxlink-chainlink'
const LOOPBACK_127_ENDPOINT = 'ws://127.0.0.1:9090/dxlink-chainlink'

// The framework resolves requestContext.transportName (ws|rest) BEFORE calling
// customInputValidation, so a WS-path request is exactly a request whose
// resolved transport is "ws".
const wsRequest = { requestContext: { transportName: 'ws' } } as any

/** Runs fn with NODE_ENV patched, restoring it afterwards. */
const withNodeEnv = (value: string | undefined, fn: () => void): void => {
  const oldNodeEnv = process.env.NODE_ENV
  try {
    if (value === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = value
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

/** Runs fn with ALLOW_INSECURE_LOOPBACK_WS patched, restoring it afterwards. */
const withLoopbackFlag = (value: string | undefined, fn: () => void): void => {
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

/**
 * Captures the warnings a FRESH config module emits while fn runs. The config
 * module binds its logger on the first log call, so the capture wires a
 * recording factory into an isolated module registry before loading the module.
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

describe('WS settings at startup (API_USERNAME/API_PASSWORD required; WS_API_ENDPOINT downgraded to request-time per the REST-only deployment plan item)', () => {
  it('fails startup when API_USERNAME and API_PASSWORD are unset', () => {
    withSettings(
      { API_USERNAME: undefined, API_PASSWORD: undefined, WS_API_ENDPOINT: undefined },
      () => {
        expect(() => config.validate()).toThrow(/API_USERNAME/)
        expect(() => config.validate()).toThrow(/API_PASSWORD/)
      },
    )
  })

  it('fails startup when only API_USERNAME is unset', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_USERNAME/),
    )
  })

  it('fails startup when only API_PASSWORD is unset', () => {
    withSettings(
      {
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_PASSWORD/),
    )
  })

  it('BOOTS with WS_API_ENDPOINT unset (REST-only deployment: owner decision rest_transport_scope=keep_untouched)', () => {
    // The RDD has 3 lastTradedPrice params with no transport param that fall
    // through to defaultTransport rest: a deployment serving only those cannot
    // provide a WS endpoint, so the boot must not demand one. The WS requirement
    // is enforced per-request by wsEnvInputValidationError instead.
    withSettings(
      {
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: undefined,
        API_ENDPOINT: 'https://rest.fake.test/webservice/rest',
      },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('passes startup when all three are set with a clean dxLink WS_API_ENDPOINT', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('WS-path request-time credential gate (spec breaking_change_env_checks: require API_USERNAME and API_PASSWORD to be set (WS paths))', () => {
  it('rejects a stock_quotes request without credentials with a validation error naming the pair', () => {
    // stock_quotes is WS-only: its customInputValidation repeats the
    // credential-pair check with a clear per-request error — defense in depth
    // behind the startup AdapterConfig requirement
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
})

describe('loopback ws:// opt-in gate (plan item 2: the loopback ws:// exemption is gated behind ALLOW_INSECURE_LOOPBACK_WS, default false; non-loopback ws:// still fails closed)', () => {
  it('rejects ws://localhost when ALLOW_INSECURE_LOOPBACK_WS is unset (default false: the Basic credentials must not ride a plaintext handshake without explicit opt-in)', () => {
    withLoopbackFlag(undefined, () => expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).not.toBe(''))
  })

  it('rejects ws://localhost when the flag is anything but true (only an explicit opt-in opens the exemption)', () => {
    withLoopbackFlag('false', () => expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).not.toBe(''))
  })

  it('accepts ws://127.0.0.1 when ALLOW_INSECURE_LOOPBACK_WS=true', () => {
    withLoopbackFlag('true', () => expect(validateWsApiEndpoint(LOOPBACK_127_ENDPOINT)).toBe(''))
  })

  it('accepts ws://localhost with the flag set regardless of NODE_ENV', () => {
    withNodeEnv('production', () =>
      withLoopbackFlag('true', () => expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).toBe('')),
    )
  })

  it('rejects a ws:// non-loopback host even when ALLOW_INSECURE_LOOPBACK_WS=true (the flag only exempts loopback)', () => {
    withLoopbackFlag('true', () =>
      expect(validateWsApiEndpoint('ws://example.com/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('fails startup: a loopback ws:// WS_API_ENDPOINT without the flag fails config.validate()', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: 'ws://localhost:1',
        ALLOW_INSECURE_LOOPBACK_WS: undefined,
      },
      () => expect(() => config.validate()).toThrow(),
    )
  })

  it('accepts ws://[::1] with the flag set (the third loopback form) while ws:// on any non-loopback host stays rejected', () => {
    withLoopbackFlag('true', () => {
      // Loopback IPv6 literal: accepted like localhost and 127.0.0.1
      expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toBe('')
    })

    // Non-loopback ws:// fails closed regardless of the flag
    expect(validateWsApiEndpoint('ws://dxlink.fake.test/dxlink-chainlink')).toContain('wss://')
  })

  it('boots at startup with the flag set: a loopback ws:// WS_API_ENDPOINT passes config.validate() (the test-bridge boot path with the explicit opt-in)', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT, ALLOW_INSECURE_LOOPBACK_WS: 'true' },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('loopback endpoint parse failure (plan item 3: the loopback branch never throws on a URL the loopback check accepts but URL cannot parse)', () => {
  it('returns an error string and does not throw for ws://localhost:notaport with the flag unset', () => {
    withLoopbackFlag(undefined, () => {
      let result: string | undefined
      expect(() => {
        result = validateWsApiEndpoint('ws://localhost:notaport')
      }).not.toThrow()
      expect(result).toBeDefined()
      expect(result).not.toBe('')
    })
  })

  it('with the flag set, ws://localhost:notaport still does not throw and is accepted (the parse failure only degrades the warning log)', () => {
    withLoopbackFlag('true', () => {
      let result: string | undefined
      expect(() => {
        result = validateWsApiEndpoint('ws://localhost:notaport')
      }).not.toThrow()
      expect(result).toBe('')
    })
  })
})

describe('loopback warning content (the flag is for local test bridges only and the warning says so in the log itself — no runbook file; the sensitive WS_API_ENDPOINT value never reaches the logs)', () => {
  it('logs the parsed host and scheme but not the full WS_API_ENDPOINT value or any credential', () => {
    withLoopbackFlag('true', () => {
      const warnings = withRecordingLogger((validate) => {
        expect(validate(LOOPBACK_ENDPOINT)).toBe('')
      })

      expect(warnings).toHaveLength(1)
      // The parsed scheme and host are in the log entry...
      expect(warnings[0]).toContain('ws://')
      expect(warnings[0]).toContain('localhost')
      // ...the raw sensitive value (and any unique part of it) is not, and
      // neither is any credential material
      expect(warnings[0]).not.toContain(LOOPBACK_ENDPOINT)
      expect(warnings[0]).not.toContain('/dxlink-chainlink')
      expect(warnings[0]).not.toContain(':9090/dxlink')
      expect(warnings[0]).not.toContain('dxfeed-pass')
    })
  })

  it('states the deployment restriction: the flag is for local test bridges only and the Basic credentials cross the wire unencrypted', () => {
    withLoopbackFlag('true', () => {
      const warnings = withRecordingLogger((validate) => {
        expect(validate(LOOPBACK_ENDPOINT)).toBe('')
      })

      expect(warnings).toHaveLength(1)
      // The log message is the in-package mitigation: it must carry the
      // restriction statement itself
      expect(warnings[0]).toMatch(/unencrypted/i)
      expect(warnings[0]).toMatch(/test bridge/i)
    })
  })

  it('emits no loopback warning for the encrypted wss:// dxLink endpoint', () => {
    const warnings = withRecordingLogger((validate) => {
      expect(validate(DXLINK_ENDPOINT)).toBe('')
    })
    expect(warnings).toHaveLength(0)
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
})

describe('framework pin (spec framework_version 2.20.0)', () => {
  it('resolves @chainlink/external-adapter-framework to >= 2.20.0 (customSubscriptionMessages availability)', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    const version = packageJson.dependencies['@chainlink/external-adapter-framework']
    expect(version).toBeDefined()

    const [major, minor] = version.split('.').map(Number)
    const atLeast_2_20 = major > 2 || (major === 2 && minor >= 20)
    expect(atLeast_2_20).toBe(true)
  })
})
