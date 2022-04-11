import { DEFAULT_SAVAX_ADDRESS, makeConfig } from '../../src/config'

describe('execute', () => {
  describe('config', () => {
    beforeEach(() => {
      process.env.AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || 'http://localhost:8546/'
    })

    afterEach(() => {
      delete process.env.AVALANCHE_RPC_URL
      delete process.env.SAVAX_ADDRESS
    })

    it('correctly sets the env vars for the EA', () => {
      const config = makeConfig()
      expect(config.rpcUrl).toEqual(process.env.AVALANCHE_RPC_URL)
      expect(config.sAvaxAddress).toEqual(DEFAULT_SAVAX_ADDRESS)
    })

    it('correctly sets the sAVAX contract address if one is provided', () => {
      process.env.SAVAX_ADDRESS = 'test-address'
      const config = makeConfig()
      expect(config.rpcUrl).toEqual(process.env.AVALANCHE_RPC_URL)
      expect(config.sAvaxAddress).toEqual(process.env.SAVAX_ADDRESS)
    })
  })
})
