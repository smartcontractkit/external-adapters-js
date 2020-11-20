import { expect } from 'chai'
import { Requester } from '../src/requester'

const ENV_API_KEY = 'API_KEY'

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
})
