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
const DXLINK_ENDPOINT = 'wss://tools.dxfeed.com/dxlink-chainlink'
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

describe('credential pair required at startup (spec environment_variables required=true / CONF-ENV-MISMATCH:API_USERNAME+API_PASSWORD)', () => {
  // With a clean wss:// dxLink WS_API_ENDPOINT, the ONLY possible validation
  // failure is the missing credential, so a plain toThrow() pins the startup
  // gate without coupling to the framework's error wording
  it('fails config validation when both API_USERNAME and API_PASSWORD are unset', () => {
    withSettings(
      { API_USERNAME: undefined, API_PASSWORD: undefined, WS_API_ENDPOINT: DXLINK_ENDPOINT },
      () => expect(() => config.validate()).toThrow(),
    )
  })

  it('fails config validation when only API_USERNAME is unset', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(),
    )
  })

  it('fails config validation when only API_PASSWORD is unset', () => {
    withSettings(
      {
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(),
    )
  })

  it('passes config validation when both credentials are set with the dxLink endpoint', () => {
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
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://tools.dxfeed.com/chainlink/cometd' },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
  })

  it('rejects a WS_API_ENDPOINT carrying embedded ://user:pass@ credentials', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://user:pass@tools.dxfeed.com/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })

  it('accepts wss://tools.dxfeed.com/dxlink-chainlink', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('loopback ws:// exemption gated on ALLOW_INSECURE_LOOPBACK_WS (explicit opt-in: no NODE_ENV fallback)', () => {
  it('rejects ws://127.0.0.1 even under NODE_ENV=test when ALLOW_INSECURE_LOOPBACK_WS is unset', () => {
    // NODE_ENV is set widely in staging and CI: it must NOT open the plaintext
    // downgrade path — only the explicit opt-in flag does
    withNodeEnv('test', () =>
      withLoopbackFlag(undefined, () =>
        expect(validateWsApiEndpoint(LOOPBACK_127_ENDPOINT)).toContain('wss://'),
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

  it('rejects ws://localhost when the flag is anything other than true (default unset fails closed)', () => {
    withLoopbackFlag('false', () =>
      expect(validateWsApiEndpoint(LOOPBACK_ENDPOINT)).toContain('wss://'),
    )
  })

  it('rejects a ws:// non-loopback host even when ALLOW_INSECURE_LOOPBACK_WS=true', () => {
    withLoopbackFlag('true', () =>
      expect(validateWsApiEndpoint('ws://example.com/dxlink-chainlink')).toContain('wss://'),
    )
  })

  it('enforces the gate at startup: a loopback ws:// WS_API_ENDPOINT fails config.validate() with the flag unset', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT, ALLOW_INSECURE_LOOPBACK_WS: undefined },
      () => expect(() => config.validate()).toThrow(/wss:\/\//),
    )
  })

  it('starts cleanly with the flag set: a loopback ws:// WS_API_ENDPOINT passes config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: LOOPBACK_ENDPOINT, ALLOW_INSECURE_LOOPBACK_WS: 'true' },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('loopback warning censoring (round-2 item 6: the sensitive WS_API_ENDPOINT value never reaches the logs)', () => {
  it('logs the parsed host and scheme but not the full WS_API_ENDPOINT value', () => {
    withLoopbackFlag('true', () => {
      const warnings = withRecordingLogger((validate) => {
        expect(validate(LOOPBACK_ENDPOINT)).toBe('')
      })

      expect(warnings).toHaveLength(1)
      // The parsed scheme and host are in the log entry...
      expect(warnings[0]).toContain('ws://')
      expect(warnings[0]).toContain('localhost')
      // ...the raw sensitive value (and any unique part of it) is not
      expect(warnings[0]).not.toContain(LOOPBACK_ENDPOINT)
      expect(warnings[0]).not.toContain('/dxlink-chainlink')
      expect(warnings[0]).not.toContain(':9090/dxlink')
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
