import { expect } from 'chai'
import { ENV_API_TIMEOUT, DEFAULT_TIMEOUT, getConfig } from '../src/config'

describe('config', () => {
  beforeEach(() => {
    delete process.env[ENV_API_TIMEOUT]
  })

  context('when no env is set', () => {
    it(`configures app with default ${DEFAULT_TIMEOUT} timeout`, () => {
      const config = getConfig()
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('timeout', DEFAULT_TIMEOUT)
    })
  })

  context(`when ${ENV_API_TIMEOUT} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_TIMEOUT] = '10000'
    })

    it(`configures app with env set ${ENV_API_TIMEOUT} timeout`, () => {
      const config = getConfig()
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('timeout', 10000)
    })
  })
})
