import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import { addProvider, getProvider } from '../../src/transport/providerUtils'

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

const createMockProvider = (rpcUrl: string, chainId: number) =>
  ({
    rpcUrl,
    chainId,
  } as unknown as ethers.providers.JsonRpcProvider)

jest.mock('ethers', () => ({
  ethers: {
    providers: {
      JsonRpcProvider: function (rpcUrl: string, chainId: number) {
        return createMockProvider(rpcUrl, chainId)
      },
    },
  },
}))

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}

LoggerFactoryProvider.set({ child: () => logger })

describe('providerUtils', () => {
  const baseRpcUrl = 'https://base.rpc.url'
  const baseRpcChainId = 8453
  const arbitrumRpcUrl = 'https://arbitrum.rpc.url'
  const arbitrumRpcChainId = 42161

  beforeEach(async () => {
    restoreEnv()
    log.mockClear()
  })

  describe('addProvider', () => {
    it('should add a provider to the providers object if environment variables are set', () => {
      process.env.BASE_RPC_URL = baseRpcUrl
      process.env.BASE_RPC_CHAIN_ID = baseRpcChainId.toString()

      const providers = addProvider('base', {})

      expect(providers).toEqual({ base: createMockProvider(baseRpcUrl, baseRpcChainId) })
    })

    it('should add multiple providers', () => {
      process.env.BASE_RPC_URL = baseRpcUrl
      process.env.BASE_RPC_CHAIN_ID = baseRpcChainId.toString()
      process.env.ARBITRUM_RPC_URL = arbitrumRpcUrl
      process.env.ARBITRUM_RPC_CHAIN_ID = arbitrumRpcChainId.toString()

      let providers = {}
      providers = addProvider('base', providers)
      providers = addProvider('arbitrum', providers)

      expect(providers).toEqual({
        base: createMockProvider(baseRpcUrl, baseRpcChainId),
        arbitrum: createMockProvider(arbitrumRpcUrl, arbitrumRpcChainId),
      })
      expect(log).toHaveBeenCalledTimes(0)
    })

    it('should log if RPC URL is missing', () => {
      process.env.BASE_RPC_CHAIN_ID = baseRpcChainId.toString()

      const providers = addProvider('base', {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'BASE_RPC_URL' or 'BASE_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })

    it('should log if chain ID is missing', () => {
      process.env.BASE_RPC_URL = baseRpcUrl

      const providers = addProvider('base', {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'BASE_RPC_URL' or 'BASE_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })

    it('should log if RPC URL and chain ID are both missing', () => {
      const providers = addProvider('base', {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'BASE_RPC_URL' or 'BASE_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })
  })

  describe('getProvider', () => {
    it('should return the provider for the specified network if it exists', () => {
      const mockProvider = createMockProvider(baseRpcUrl, baseRpcChainId)
      const providers = { base: mockProvider }

      const provider = getProvider('base', providers)

      expect(provider).toEqual(mockProvider)
    })

    it('should return default provider if network specific provider is not present', () => {
      const defaultProvider = createMockProvider('https://eth.rpc.url', 1)

      const provider = getProvider('base', {}, defaultProvider)

      expect(provider).toEqual(defaultProvider)
    })

    it('should throw if network specific provider and default are not present', () => {
      expect(() => getProvider('base', {})).toThrowError(
        `Missing BASE_RPC_URL or BASE_RPC_CHAIN_ID environment variables`,
      )
    })
  })
})
