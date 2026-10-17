import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fs from 'fs'
import * as path from 'path'
import { config, missingWsCredentials } from '../../src/config'
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

// The framework resolves requestContext.transportName (ws|rest) BEFORE calling
// customInputValidation, so a WS-path request is exactly a request whose
// resolved transport is "ws".
const wsRequest = { requestContext: { transportName: 'ws' } } as any

describe('credential pair required at startup (spec environment_variables: API_USERNAME/API_PASSWORD required: true)', () => {
  it('fails startup with a clear error when API_USERNAME is unset', () => {
    withSettings(
      {
        API_USERNAME: undefined,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_USERNAME/),
    )
  })

  it('fails startup with a clear error when API_PASSWORD is unset', () => {
    withSettings(
      {
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => expect(() => config.validate()).toThrow(/API_PASSWORD/),
    )
  })

  it('fails startup when both credentials are unset', () => {
    withSettings(
      { API_USERNAME: undefined, API_PASSWORD: undefined, WS_API_ENDPOINT: DXLINK_ENDPOINT },
      () => expect(() => config.validate()).toThrow(/API_USERNAME/),
    )
  })

  it('starts when both credentials are set with the dxLink endpoint', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
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

describe('WS-path request-time credential gate (spec breaking_change_env_checks: require API_USERNAME and API_PASSWORD to be set (WS paths))', () => {
  it('rejects a stock_quotes request without credentials with a validation error naming the pair', () => {
    // stock_quotes is WS-only: its customInputValidation enforces the
    // credential pair with a clear per-request error
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    } as any)
    expect(error?.message).toContain('API_USERNAME')
    expect(error?.message).toContain('API_PASSWORD')
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
