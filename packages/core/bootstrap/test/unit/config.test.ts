import { constants } from '../../src/lib/config'
import { Requester } from '../../src/lib/modules/requester'
const { ENV_API_ENDPOINT, ENV_API_KEY, ENV_API_TIMEOUT, ENV_API_VERBOSE, DEFAULT_API_TIMEOUT } =
  constants

describe('incorrect app config', () => {
  beforeEach(() => {
    for (const key of Object.values(constants)) {
      delete process.env[key]
    }
  })

  describe(`when ${ENV_API_KEY} is set`, () => {
    it(`configures app with ${ENV_API_KEY} key`, () => {
      process.env[ENV_API_KEY] = 'dummy.key'
      const config = Requester.getDefaultConfig()
      expect(config).toHaveProperty('apiKey', 'dummy.key')
    })
  })

  describe(`when ${ENV_API_ENDPOINT} is set`, () => {
    it(`configures app with ${ENV_API_ENDPOINT} endpoint`, () => {
      process.env[ENV_API_ENDPOINT] = 'dummy.endpoint'
      const config = Requester.getDefaultConfig()
      expect(config).toHaveProperty('api')
      expect(config.api).toHaveProperty('baseURL', 'dummy.endpoint')
    })
  })

  describe(`when ${ENV_API_TIMEOUT} is set`, () => {
    it(`configures app with ${ENV_API_TIMEOUT} endpoint`, () => {
      process.env[ENV_API_TIMEOUT] = '4'
      const config = Requester.getDefaultConfig()
      expect(config).toHaveProperty('api')
      expect(config.api).toHaveProperty('timeout', 4)
    })
  })

  describe(`when ${ENV_API_VERBOSE} is set`, () => {
    it(`configures app with ${ENV_API_VERBOSE} set to false when user sets it as "false"`, () => {
      process.env[ENV_API_VERBOSE] = 'false'
      const config = Requester.getDefaultConfig()
      expect(config).toHaveProperty('verbose')
      expect(config.verbose).toBe(false)
    })
  })

  describe('when no env is set', () => {
    it(`has default values`, () => {
      const config = Requester.getDefaultConfig()
      expect(config).toHaveProperty('apiKey', undefined)
      expect(config).toHaveProperty('api')
      expect(config.api).toHaveProperty('timeout', DEFAULT_API_TIMEOUT)
      expect(config.api).toHaveProperty('baseURL', undefined)
    })
  })
})
