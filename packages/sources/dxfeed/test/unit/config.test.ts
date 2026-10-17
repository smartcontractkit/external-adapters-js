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
 * (2.20.0), so startup behavior — including that credentials stay optional at
 * the config level — is asserted through the public initialize()/validate()
 * surface.
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

describe('credential scoping (spec breaking_change_env_checks scoped to WS paths; owner decision rest_transport_scope=keep_untouched)', () => {
  it('boots startup validation with API_USERNAME/API_PASSWORD unset — the REST-only path starts and serves without credentials', () => {
    withSettings(
      { API_USERNAME: undefined, API_PASSWORD: undefined, WS_API_ENDPOINT: DXLINK_ENDPOINT },
      () => expect(() => config.validate()).not.toThrow(),
    )
  })

  it('passes startup validation with credentials and a dxLink endpoint set', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })

  it('rejects a stock_quotes request without credentials with a validation error', () => {
    // stock_quotes is WS-only: its customInputValidation enforces the
    // credential pair that the config-level definition deliberately leaves
    // optional
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    } as any)
    expect(error?.message).toContain('API_USERNAME')
    expect(error?.message).toContain('API_PASSWORD')
  })

  it('fails the WS-path check when either one of the pair is unset', () => {
    // Spec breaking_change_env_checks: require API_USERNAME and API_PASSWORD to
    // be set (WS paths) — either one missing fails the check
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
