import { expect } from 'chai'

import { CMC_API_KEY, getConfig } from '../src/config'

describe('incorrect app config', () => {
  beforeEach(() => {
    delete process.env[CMC_API_KEY]
  })

  context(`when ${CMC_API_KEY} is set`, () => {
    beforeEach(() => {
      process.env[CMC_API_KEY] = 'dummy.key'
    })

    it(`configures app with ${CMC_API_KEY} key`, () => {
      const config = getConfig()
      expect(config).to.have.property('cmcApiKey', 'dummy.key')
    })
  })
})