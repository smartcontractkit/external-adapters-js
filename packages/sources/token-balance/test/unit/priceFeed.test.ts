import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../../src//config/EACAggregatorProxy.json'
import { getEvmProvider, getRate, getTokenPrice } from '../../src/transport/priceFeed'

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

const ethersNewContract = jest.fn()
const ethersNewJsonRpcProvider = jest.fn()

const makeEthers = () => {
  return {
    JsonRpcProvider: function (...args: [string, number]) {
      return ethersNewJsonRpcProvider(...args)
    },
    Contract: function (...args: [string, unknown, ethers.JsonRpcProvider]) {
      return ethersNewContract(...args)
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

describe('priceFeed', () => {
  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
  })

  describe('getRate', () => {
    it('should return the token price', async () => {
      const priceOracleAddress = '0x123'
      const expectedPrice = {
        value: 12345678n,
        decimal: 8,
      }

      const provider = makeStub('provider', {} as ethers.JsonRpcProvider)

      const contract = makeStub('contract', {
        decimals: jest.fn().mockResolvedValue(expectedPrice.decimal),
        latestAnswer: jest.fn().mockResolvedValue(expectedPrice.value),
      })
      ethersNewContract.mockReturnValue(contract)

      const price = await getRate(priceOracleAddress, provider)
      expect(price).toEqual(expectedPrice)

      expect(ethersNewContract).toBeCalledWith(priceOracleAddress, EACAggregatorProxy, provider)
      expect(ethersNewContract).toBeCalledTimes(1)
    })
  })

  describe('getTokenPrice', () => {
    it('should return the token price', async () => {
      const arbitrumRpcUrl = 'https://arb.rpc.url'
      const arbitrumChainId = 42161
      process.env.ARBITRUM_RPC_URL = arbitrumRpcUrl
      process.env.ARBITRUM_RPC_CHAIN_ID = arbitrumChainId.toString()

      const priceOracleAddress = '0x123'
      const priceOracleNetwork = 'arbitrum'
      const expectedPrice = {
        value: 12345678n,
        decimal: 8,
      }

      const provider = makeStub('provider', {})
      ethersNewJsonRpcProvider.mockReturnValue(provider)

      const contract = makeStub('contract', {
        decimals: jest.fn().mockResolvedValue(expectedPrice.decimal),
        latestAnswer: jest.fn().mockResolvedValue(expectedPrice.value),
      })
      ethersNewContract.mockReturnValue(contract)

      const price = await getTokenPrice({
        priceOracleAddress,
        priceOracleNetwork,
      })
      expect(price).toEqual(expectedPrice)

      expect(ethersNewJsonRpcProvider).toBeCalledWith(arbitrumRpcUrl, arbitrumChainId)
      expect(ethersNewJsonRpcProvider).toBeCalledTimes(1)
      expect(ethersNewContract).toBeCalledWith(priceOracleAddress, EACAggregatorProxy, provider)
      expect(ethersNewContract).toBeCalledTimes(1)
    })
  })

  describe('getEvmProvider', () => {
    it('should create new JsonRpcProvider with given URL and chain ID', () => {
      const arbitrumRpcUrl = 'https://arb.rpc.url'
      const arbitrumChainId = 42161
      process.env.ARBITRUM_RPC_URL = arbitrumRpcUrl
      process.env.ARBITRUM_RPC_CHAIN_ID = arbitrumChainId.toString()

      const provider = makeStub('provider', {})
      ethersNewJsonRpcProvider.mockReturnValue(provider)

      expect(ethersNewJsonRpcProvider).toBeCalledTimes(0)
      expect(getEvmProvider('arbitrum')).toBe(provider)
      expect(ethersNewJsonRpcProvider).toBeCalledWith(arbitrumRpcUrl, arbitrumChainId)
      expect(ethersNewJsonRpcProvider).toBeCalledTimes(1)
    })
  })
})
