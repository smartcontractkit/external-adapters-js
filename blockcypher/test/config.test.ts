import { expect } from 'chai'

import { ENV_API_KEY, getConfig } from '../src/config'

describe('incorrect app config', () => {
  beforeEach(() => {
    delete process.env[ENV_API_KEY]
  })

  context(`when ${ENV_API_KEY} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_KEY] = 'dummy.key'
    })

    it(`configures app with ${ENV_API_KEY} key`, () => {
      const config = getConfig()
      expect(config).to.have.property('apiKey', 'dummy.key')
    })
  })
})
