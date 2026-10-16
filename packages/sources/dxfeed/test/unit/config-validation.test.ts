import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config, validateWsApiEndpoint } from '../../src/config'

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
    expect(validateWsApiEndpoint('wss://tools.dxfeed.com/dxlink-chainlink')).toBe('')
  })

  it('is wired as the startup validator for WS_API_ENDPOINT', () => {
    expect(config.settingsDefinition.WS_API_ENDPOINT.validate?.fn).toBe(validateWsApiEndpoint)
  })
})

describe('required credentials (spec data_source_authentication: require API_USERNAME and API_PASSWORD)', () => {
  const oldEnv = JSON.parse(JSON.stringify(process.env))

  afterEach(() => {
    setEnvVariables(oldEnv)
    config.initialize()
  })

  it('fails startup validation when the credentials are missing', () => {
    delete process.env['API_USERNAME']
    delete process.env['API_PASSWORD']
    process.env['WS_API_ENDPOINT'] = 'wss://tools.dxfeed.com/dxlink-chainlink'
    config.initialize()

    let message = ''
    try {
      config.validate()
    } catch (e) {
      message = (e as Error).message
    }
    expect(message).toContain('API_USERNAME')
    expect(message).toContain('API_PASSWORD')
  })

  it('passes startup validation with credentials and a dxLink endpoint set', () => {
    process.env['API_USERNAME'] = 'dxfeed-user'
    process.env['API_PASSWORD'] = 'dxfeed-pass'
    process.env['WS_API_ENDPOINT'] = 'wss://tools.dxfeed.com/dxlink-chainlink'
    config.initialize()

    expect(() => config.validate()).not.toThrow()
  })

  it('marks API_PASSWORD (not API_USERNAME) as sensitive', () => {
    expect(config.settingsDefinition.API_PASSWORD.sensitive).toBe(true)
    expect(config.settingsDefinition.API_USERNAME.sensitive).toBe(false)
  })
})
