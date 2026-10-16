import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config, validateWsApiEndpoint } from '../../src/config'

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
const DXLINK_ENDPOINT = 'wss://tools.dxfeed.com/dxlink-chainlink'

describe('WS_API_ENDPOINT validation (spec breaking_change_env_checks)', () => {
  it('rejects the deleted legacy cometd endpoint', () => {
    expect(validateWsApiEndpoint('wss://tools.dxfeed.com/chainlink/cometd')).toContain('cometd')
  })

  it('rejects credentials embedded in the URL', () => {
    expect(validateWsApiEndpoint('wss://user:pass@tools.dxfeed.com/dxlink-chainlink')).toContain(
      'credentials',
    )
  })

  it('accepts the dxLink endpoint', () => {
    expect(validateWsApiEndpoint(DXLINK_ENDPOINT)).toBe('')
  })

  it('runs the validator at startup: a cometd WS_API_ENDPOINT fails config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://tools.dxfeed.com/chainlink/cometd' },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
  })

  it('runs the validator at startup: an endpoint with embedded credentials fails config.validate()', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://user:pass@tools.dxfeed.com/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })
})

describe('required credentials (spec data_source_authentication: require API_USERNAME and API_PASSWORD)', () => {
  it('fails startup validation when the credentials are missing', () => {
    withSettings(
      {
        ...CREDENTIALS,
        API_USERNAME: undefined,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      },
      () => {
        let message = ''
        try {
          config.validate()
        } catch (e) {
          message = (e as Error).message
        }
        expect(message).toContain('API_USERNAME')
        expect(message).toContain('API_PASSWORD')
      },
    )
  })

  it('passes startup validation with credentials and a dxLink endpoint set', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })
})
