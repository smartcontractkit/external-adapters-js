import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import { config } from '../../src/config'
import { addProvider, getProvider } from '../../src/transport/providerUtils'

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
  const bscRpcUrl = 'https://bsc.rpc.url'
  const polygonRpcChainId = 137

  const adapterSettings = {
    NETWORK_RPC_URL: {
      get(network: string) {
        switch (network) {
          case 'base':
            return baseRpcUrl
          case 'arbitrum':
            return arbitrumRpcUrl
          case 'bsc':
            return bscRpcUrl
          default:
            return undefined
        }
      },
      getEnvVarName(network: string) {
        return `${network.toUpperCase()}_RPC_URL`
      },
    },
    NETWORK_RPC_CHAIN_ID: {
      get(network: string) {
        switch (network) {
          case 'base':
            return baseRpcChainId
          case 'arbitrum':
            return arbitrumRpcChainId
          case 'polygon':
            return polygonRpcChainId
          default:
            return undefined
        }
      },
      getEnvVarName(network: string) {
        return `${network.toUpperCase()}_RPC_CHAIN_ID`
      },
    },
  } as typeof config.settings

  beforeEach(async () => {
    log.mockClear()
  })

  describe('addProvider', () => {
    it('should add a provider to the providers object if environment variables are set', () => {
      const providers = addProvider('base', adapterSettings, {})

      expect(providers).toEqual({ base: createMockProvider(baseRpcUrl, baseRpcChainId) })
    })

    it('should add multiple providers', () => {
      let providers = {}
      providers = addProvider('base', adapterSettings, providers)
      providers = addProvider('arbitrum', adapterSettings, providers)

      expect(providers).toEqual({
        base: createMockProvider(baseRpcUrl, baseRpcChainId),
        arbitrum: createMockProvider(arbitrumRpcUrl, arbitrumRpcChainId),
      })
      expect(log).toHaveBeenCalledTimes(0)
    })

    it('should log if RPC URL is missing', () => {
      const providers = addProvider('polygon', adapterSettings, {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'POLYGON_RPC_URL' or 'POLYGON_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })

    it('should log if chain ID is missing', () => {
      const providers = addProvider('bsc', adapterSettings, {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'BSC_RPC_URL' or 'BSC_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })

    it('should log if RPC URL and chain ID are both missing', () => {
      const providers = addProvider('optimism', adapterSettings, {})

      expect(providers).toEqual({})
      expect(log).toHaveBeenCalledWith(
        `Missing 'OPTIMISM_RPC_URL' or 'OPTIMISM_RPC_CHAIN_ID' environment variables. Using RPC_URL and CHAIN_ID instead`,
      )
      expect(log).toHaveBeenCalledTimes(1)
    })
  })

  describe('getProvider', () => {
    it('should return the provider for the specified network if it exists', () => {
      const mockProvider = createMockProvider(baseRpcUrl, baseRpcChainId)
      const providers = { base: mockProvider }

      const provider = getProvider('base', adapterSettings, providers)

      expect(provider).toEqual(mockProvider)
    })

    it('should return default provider if network specific provider is not present', () => {
      const defaultProvider = createMockProvider('https://eth.rpc.url', 1)

      const provider = getProvider('base', adapterSettings, {}, defaultProvider)

      expect(provider).toEqual(defaultProvider)
    })

    it('should throw if network specific provider and default are not present', () => {
      expect(() => getProvider('base', adapterSettings, {})).toThrowError(
        `Missing BASE_RPC_URL or BASE_RPC_CHAIN_ID environment variables`,
      )
    })
  })
})
