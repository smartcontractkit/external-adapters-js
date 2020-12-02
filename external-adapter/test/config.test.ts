import { expect } from 'chai'
import { Requester } from '../src/requester'
import util from '@chainlink/ea-bootstrap'

const ENV_API_KEY = 'API_KEY'
const ENV_API_ENDPOINT = 'API_ENDPOINT'

describe('incorrect app config', () => {
  beforeEach(() => {
    delete process.env[ENV_API_KEY]
  })

  context(`when ${ENV_API_KEY} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_KEY] = 'dummy.key'
    })

    it(`configures app with ${ENV_API_KEY} key`, () => {
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('apiKey', 'dummy.key')
    })
  })

  context('when no env is set', () => {
    it(`throws RequiredEnvError for ${ENV_API_ENDPOINT}`, () => {
      expect(() => util.getRequiredEnv(ENV_API_ENDPOINT)) //
        .throws(util.RequiredEnvError, ENV_API_ENDPOINT)
    })
  })

  context(`when ${ENV_API_ENDPOINT} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_ENDPOINT] = 'dummy.endpoint'
    })

    it(`configures app with ${ENV_API_ENDPOINT} endpoint`, () => {
      const config = Requester.getDefaultConfig()
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('baseURL', 'dummy.endpoint')
    })
  })
})
