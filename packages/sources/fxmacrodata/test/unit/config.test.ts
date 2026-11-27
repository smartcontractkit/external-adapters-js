import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config } from '../../src/config'

describe('config', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'fake-api-key'
    delete process.env.API_ENDPOINT
  })

  afterEach(() => {
    setEnvVariables(oldEnv)
  })

  it('should accept the default HTTPS endpoint', () => {
    config.initialize()
    expect(() => config.validate()).not.toThrow()
    expect(config.settings.API_ENDPOINT).toBe('https://api.fxmacrodata.com/v1')
  })

  it('should reject a non-HTTPS endpoint', () => {
    process.env.API_ENDPOINT = 'http://api.fxmacrodata.com/v1'
    config.initialize()
    expect(() => config.validate()).toThrow(
      'API_ENDPOINT must be an HTTPS URL. Received http://api.fxmacrodata.com/v1',
    )
  })
})
