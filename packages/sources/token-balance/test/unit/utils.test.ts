import { getNetworkEnvVar } from '../../src/transport/utils'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

describe('transport/utils.ts', () => {
  beforeEach(() => {
    restoreEnv()
    jest.useFakeTimers()
    jest.resetAllMocks()
  })

  describe('getNetworkEnvVar', () => {
    it('should return the environment variable value for given network and suffix', () => {
      const ethereumRpcUrl = 'https://ethereum.rpc.url'
      process.env.ETHEREUM_RPC_URL = ethereumRpcUrl
      expect(getNetworkEnvVar('ETHEREUM', '_RPC_URL')).toEqual(ethereumRpcUrl)
    })

    it('should convert the network to upper case', () => {
      const ethereumRpcUrl = 'https://ethereum.rpc.url'
      process.env.ETHEREUM_RPC_URL = ethereumRpcUrl
      expect(getNetworkEnvVar('ethereum', '_RPC_URL')).toEqual(ethereumRpcUrl)
    })

    it('should work with different network and suffix', () => {
      const arbitrumRpcChainId = '42161'
      process.env.ARBITRUM_RPC_CHAIN_ID = arbitrumRpcChainId
      expect(getNetworkEnvVar('arbitrum', '_RPC_CHAIN_ID')).toEqual(arbitrumRpcChainId)
    })

    it('should throw if the variable is not set', () => {
      expect(() => getNetworkEnvVar('ethereum', '_RPC_URL')).toThrow(
        'Environment variable ETHEREUM_RPC_URL is missing',
      )
    })
  })
})
