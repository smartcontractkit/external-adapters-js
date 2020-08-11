import { assert, expect } from 'chai'

import {
  ENV_API_ENDPOINT,
  RequiredEnvError,
  getRequiredEnv,
  getConfig,
} from '../src/config'

describe('incorrect app config', () => {
  beforeEach(() => {
    delete process.env[ENV_API_ENDPOINT]
  })

  context('when no env is set', () => {
    it(`throws RequiredEnvError for ${ENV_API_ENDPOINT}`, () => {
      expect(() => getRequiredEnv(ENV_API_ENDPOINT)) //
        .throws(RequiredEnvError, ENV_API_ENDPOINT)
    })
  })

  context(`when ${ENV_API_ENDPOINT} is set`, () => {
    beforeEach(() => {
      process.env[ENV_API_ENDPOINT] = 'dummy.endpoint'
    })

    it(`configures app with ${ENV_API_ENDPOINT} endpoint`, () => {
      const config = getConfig();
      expect(config).to.have.property('api')
      expect(config.api).to.have.property('baseURL', 'dummy.endpoint')
    })
  })
})
