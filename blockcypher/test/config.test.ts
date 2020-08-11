import { expect } from 'chai'

import { ENV_API_TOKEN, getConfig } from '../src/config'

describe('incorrect app config', () => {
  beforeEach(() => {
    delete process.env[ENV_API_TOKEN]
  })

  context(`when ${ENV_API_TOKEN} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_TOKEN] = 'dummy.token'
    })

    it(`configures app with ${ENV_API_TOKEN} token`, () => {
      const config = getConfig()
      expect(config).to.have.property('token', 'dummy.token')
    })
  })
})
