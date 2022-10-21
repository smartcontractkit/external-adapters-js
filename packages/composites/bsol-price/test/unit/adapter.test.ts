import { makeConfig } from '../../src/config'

describe('execute', () => {
  const SOLIDO_ADDRESS = 'EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ'
  const STSOL_ADDRESS = 'BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN'
  const BSOL_ADDRESS = '3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz'
  const SOLIDO_CONTRACT_VERSION = '0'

  beforeEach(() => {
    process.env.SOLIDO_ADDRESS = SOLIDO_ADDRESS
    process.env.STSOL_ADDRESS = STSOL_ADDRESS
    process.env.BSOL_ADDRESS = BSOL_ADDRESS
    process.env.SOLIDO_CONTRACT_VERSION = SOLIDO_CONTRACT_VERSION
  })

  afterEach(() => {
    delete process.env.SOLIDO_ADDRESS
    delete process.env.STSOL_ADDRESS
    delete process.env.BSOL_ADDRESS
    delete process.env.SOLIDO_CONTRACT_VERSION
  })

  describe('config', () => {
    it('correctly sets the config from env vars', async () => {
      const config = makeConfig()

      expect(config.solidoAddress).toEqual(SOLIDO_ADDRESS)
      expect(config.stSolAddress).toEqual(STSOL_ADDRESS)
      expect(config.bSolAddress).toEqual(BSOL_ADDRESS)
      expect(config.solidoContractVersion).toEqual(parseInt(SOLIDO_CONTRACT_VERSION))
    })
  })
})
