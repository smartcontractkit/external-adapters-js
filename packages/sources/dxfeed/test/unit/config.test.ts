import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import { config, missingWsCredentials, validateWsApiEndpoint } from '../../src/config'
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

describe('loopback ws:// acceptance (plan item 1: ws:// loopback passes with a warning, no opt-in flag; non-loopback ws:// still fails closed)', () => {
  it('accepts ws://127.0.0.1 even under NODE_ENV=test with no opt-in flag (loopback warns instead of failing)', () => {
    // NODE_ENV is set widely in staging and CI: it neither opens nor closes the
    // loopback path — loopback hosts are accepted with a warning, period
    withNodeEnv('test', () =>
      withLoopbackFlag(undefined, () =>
        expect(validateWsApiEndpoint(LOOPBACK_127_ENDPOINT)).toBe(''),
      ),
    )
  })

  it('accepts ws://127.0.0.1 when ALLOW_INSECURE_LOOPBACK_WS=true', () => {
    withLoopbackFlag('true', () => expect(validateWsApiEndpoint(LOOPBACK_127_ENDPOINT)).toBe(''))
  })

  it('accepts ws://localhost with the flag set regardless of NODE_ENV', () => {
    withNodeEnv('production', () =>
      withLoopbackFlag('true', () => expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).toBe('')),
    )
  })

  it('accepts ws://localhost when the flag is anything other than true (the flag no longer gates the loopback case)', () => {
    withLoopbackFlag('false', () => expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).toBe(''))
  })

  it('rejects a ws:// non-loopback host even when ALLOW_INSECURE_LOOPBACK_WS=true (plan item 1: the hard error stays for non-wss:// non-loopback hosts)', () => {
    withLoopbackFlag('true', () =>
      expect(validateWsApiEndpoint('ws://example.com/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('boots at startup: a loopback ws:// WS_API_ENDPOINT passes config.validate() with no flag (the golden-test boot path, WS_API_ENDPOINT=ws://localhost:1)', () => {
    withSettings(
      {
        ...CREDENTIALS,
        WS_API_ENDPOINT: 'ws://localhost:1',
        ALLOW_INSECURE_LOOPBACK_WS: undefined,
      },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('accepts ws://[::1] (the third loopback form) while ws:// on any non-loopback host stays rejected', () => {
    // Loopback IPv6 literal: accepted like localhost and 127.0.0.1
    expect(validateWsApiEndpoint('ws://[::1]:9090/dxlink-chainlink')).toBe('')

    // Non-loopback ws:// fails closed regardless of host
    expect(validateWsApiEndpoint('ws://dxlink.fake.test/dxlink-chainlink')).toContain('wss://')
  })

  it('starts cleanly with the flag set: a loopback ws:// WS_API_ENDPOINT passes config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT, ALLOW_INSECURE_LOOPBACK_WS: 'true' },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('loopback warning content (plan item 4: the flag is for local test bridges only and the warning says so in the log itself — no runbook file; the sensitive WS_API_ENDPOINT value never reaches the logs)', () => {
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
      // Plan item 4 fix_shape: the log message is the in-package mitigation —
      // it must carry the restriction statement itself
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
