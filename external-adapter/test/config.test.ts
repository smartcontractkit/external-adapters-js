import { expect } from 'chai'
import { Requester } from '../src/requester'
import { constants } from '../src/config'
const { ENV_API_ENDPOINT, ENV_API_KEY, ENV_API_TIMEOUT, DEFAULT_API_TIMEOUT } = constants

describe('incorrect app config', () => {
  beforeEach(() => {
    for (const key of Object.values(constants)) {
      delete process.env[key]
    }
  })

  context(`when ${ENV_API_KEY} is set`, () => {
    it(`configures app with ${ENV_API_KEY} key`, () => {
      process.env[ENV_API_KEY] = 'dummy.key'
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('apiKey', 'dummy.key')
    })
  })

  context(`when ${ENV_API_ENDPOINT} is set`, () => {
    it(`configures app with ${ENV_API_ENDPOINT} endpoint`, () => {
      process.env[ENV_API_ENDPOINT] = 'dummy.endpoint'
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('baseURL', 'dummy.endpoint')
    })
  })

  context(`when ${ENV_API_TIMEOUT} is set`, () => {
    it(`configures app with ${ENV_API_TIMEOUT} endpoint`, () => {
      process.env[ENV_API_TIMEOUT] = "4"
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('timeout', 4)
    })
  })

  context('when no env is set', () => {
    it(`has default values`, () => {
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('apiKey', undefined)
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('timeout', DEFAULT_API_TIMEOUT)
      expect(config.api).to.have.property('baseURL', undefined)
    })
  })
})
