import { deferredPromise } from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../../src/config/EACAggregatorProxy.json'
import OpenEdenTBILLProxy from '../../src/config/OpenEdenTBILLProxy.json'
import { GroupedProvider, getNetworkEnvVar } from '../../src/transport/utils'

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

const makeEthers = () => {
  return {
    JsonRpcProvider: jest.fn(),
    Contract: function (...args: [string, unknown, ethers.JsonRpcProvider]) {
      return ethersNewContract(...args)
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

describe('transport/utils.ts', () => {
  beforeEach(() => {
    restoreEnv()
    jest.useFakeTimers()
    jest.resetAllMocks()
  })

  describe('GroupedProvider', () => {
    const mockProvider = {} as ethers.JsonRpcProvider
    const groupSize = 3
    const tokenContractAddress = '0x0123'
    const priceOracleAddress = '0x4567'

    it('should create a token Contract', () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)

      expect(ethersNewContract).toBeCalledTimes(0)

      groupedProvider.createTokenContract(tokenContractAddress)

      expect(ethersNewContract).toBeCalledWith(
        tokenContractAddress,
        OpenEdenTBILLProxy,
        mockProvider,
      )
      expect(ethersNewContract).toBeCalledTimes(1)
    })

    it('should call decimals on a token Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const decimals = 12n
      const mockTokenContract = {
        decimals: jest.fn().mockResolvedValue(decimals),
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      expect(await groupedTokenContract.decimals()).toBe(decimals)
      expect(mockTokenContract.decimals).toBeCalledTimes(1)
    })

    it('should call balanceOf on a token Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const walletAddress = '0x7890'
      const balance = 1234n
      const mockTokenContract = {
        balanceOf: jest.fn().mockResolvedValue(balance),
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      expect(await groupedTokenContract.balanceOf(walletAddress)).toBe(balance)
      expect(mockTokenContract.balanceOf).toBeCalledWith(walletAddress)
      expect(mockTokenContract.balanceOf).toBeCalledTimes(1)
    })

    it('should call getWithdrawalQueueLength on a token Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const queueLength = 5n
      const mockTokenContract = {
        getWithdrawalQueueLength: jest.fn().mockResolvedValue(queueLength),
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      expect(await groupedTokenContract.getWithdrawalQueueLength()).toBe(queueLength)
      expect(mockTokenContract.getWithdrawalQueueLength).toBeCalledTimes(1)
    })

    it('should call getWithdrawalQueueInfo on a token Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const queueIndex = 3
      const queueInfo = { shares: 65n }
      const mockTokenContract = {
        getWithdrawalQueueInfo: jest.fn().mockResolvedValue(queueInfo),
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      expect(await groupedTokenContract.getWithdrawalQueueInfo(queueIndex)).toBe(queueInfo)
      expect(mockTokenContract.getWithdrawalQueueInfo).toBeCalledWith(queueIndex)
      expect(mockTokenContract.getWithdrawalQueueInfo).toBeCalledTimes(1)
    })

    it('should create a price oracle Contract', () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)

      expect(ethersNewContract).toBeCalledTimes(0)

      groupedProvider.createPriceOracleContract(priceOracleAddress)

      expect(ethersNewContract).toBeCalledWith(priceOracleAddress, EACAggregatorProxy, mockProvider)
      expect(ethersNewContract).toBeCalledTimes(1)
    })

    it('should call decimals on a price oracle Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const decimals = 14n
      const mockPriceOracleContract = {
        decimals: jest.fn().mockResolvedValue(decimals),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      expect(await groupedPriceOracleContract.decimals()).toBe(decimals)
      expect(mockPriceOracleContract.decimals).toBeCalledTimes(1)
    })

    it('should call latestRoundData on a price oracle Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const value = 142536n
      const mockPriceOracleContract = {
        latestRoundData: jest.fn().mockResolvedValue([0, value, 0, 0, 0]),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)

      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      const latestRoundData = await groupedPriceOracleContract.latestRoundData()

      expect(latestRoundData).toEqual([0, 142536n, 0, 0, 0])
      expect(mockPriceOracleContract.latestRoundData).toBeCalledTimes(1)
    })

    it('should call decimals and latestAnswer for getRate', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const value = 142537n
      const decimals = 15n
      const mockPriceOracleContract = {
        decimals: jest.fn().mockResolvedValue(decimals),
        latestRoundData: jest.fn().mockResolvedValue([0, value, 0, 0, 0]),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      expect(await groupedPriceOracleContract.getRateFromLatestRoundData()).toEqual({
        value,
        decimal: Number(decimals),
      })
      expect(mockPriceOracleContract.decimals).toBeCalledTimes(1)
      expect(mockPriceOracleContract.latestRoundData).toBeCalledTimes(1)
    })

    it('should limit the number of concurrent requests to the group size', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const walletAddresses = Array.from({ length: 7 }, (_, i) => `0x${i.toString(16)}`)

      const resolvers: Array<(balance: bigint) => void> = []
      const mockTokenContract = {
        balanceOf: () => {
          const [promise, resolve] = deferredPromise<bigint>()
          resolvers.push(resolve)
          return promise
        },
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      expect(walletAddresses).toHaveLength(7)

      const promises = walletAddresses.map((walletAddress) =>
        groupedTokenContract.balanceOf(walletAddress),
      )
      await jest.runAllTimersAsync()

      expect(resolvers).toHaveLength(3)

      resolvers[0](0n)
      resolvers[1](1n)
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(3)

      resolvers[2](2n)
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(6)

      resolvers[3](3n)
      resolvers[4](4n)
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(6)

      resolvers[5](5n)
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(7)

      resolvers[6](6n)
      await jest.runAllTimersAsync()
      for (let i = 0; i < walletAddresses.length; i++) {
        expect(await promises[i]).toBe(BigInt(i))
      }
    })

    it('should concurrent requests across methods and contracts', async () => {
      const resolvers: (() => void)[] = []
      const deferred = <T>(value: T) => {
        return () => {
          const [promise, resolve] = deferredPromise<T>()
          resolvers.push(() => {
            resolve(value)
          })
          return promise
        }
      }

      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const mockTokenContract = {
        decimals: deferred(18n),
        balanceOf: deferred(100n),
        getWithdrawalQueueLength: deferred(1n),
        getWithdrawalQueueInfo: deferred({ shares: 50n }),
      }
      ethersNewContract.mockReturnValueOnce(mockTokenContract)
      const groupedTokenContract = groupedProvider.createTokenContract(tokenContractAddress)

      const mockPriceOracleContract = {
        decimals: deferred(18n),
        latestRoundData: deferred([0, 1235n, 0, 0, 0]),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      groupedTokenContract.decimals()
      groupedPriceOracleContract.decimals()
      groupedTokenContract.balanceOf('0x1234')

      groupedTokenContract.getWithdrawalQueueLength()
      groupedTokenContract.getWithdrawalQueueInfo(0)
      groupedPriceOracleContract.latestRoundData()

      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(3)

      resolvers[0]()
      resolvers[1]()
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(3)

      resolvers[2]()
      await jest.runAllTimersAsync()
      expect(resolvers).toHaveLength(6)
    })
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
