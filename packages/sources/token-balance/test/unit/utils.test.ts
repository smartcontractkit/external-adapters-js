import EACAggregatorProxy from '../../src/config/EACAggregatorProxy.json'
import { deferredPromise } from '@chainlink/external-adapter-framework/util'
import OpenEdenTBILLProxy from '../../src/config/OpenEdenTBILLProxy.json'
import { GroupedProvider } from '../../src/transport/utils'

const ethersNewContract = jest.fn()

const makeEthers = () => {
  return {
    JsonRpcProvider: jest.fn(),
    Contract: function (...args) {
      return ethersNewContract(...args)
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

describe('transport/utils.ts', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.resetAllMocks()
  })

  describe('GroupedProvider', () => {
    const mockProvider = {}
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

    it('should call latestAnswer on a price oracle Contract', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const value = 142536n
      const mockPriceOracleContract = {
        latestAnswer: jest.fn().mockResolvedValue(value),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      expect(await groupedPriceOracleContract.latestAnswer()).toBe(value)
      expect(mockPriceOracleContract.latestAnswer).toBeCalledTimes(1)
    })

    it('should call decimals and latestAnswer for getRate', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const value = 142537n
      const decimals = 15n
      const mockPriceOracleContract = {
        decimals: jest.fn().mockResolvedValue(decimals),
        latestAnswer: jest.fn().mockResolvedValue(value),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      expect(await groupedPriceOracleContract.getRate()).toEqual({
        value,
        decimal: Number(decimals),
      })
      expect(mockPriceOracleContract.decimals).toBeCalledTimes(1)
      expect(mockPriceOracleContract.latestAnswer).toBeCalledTimes(1)
    })

    it('should limit the number of concurrent requests to the group size', async () => {
      const groupedProvider = new GroupedProvider(mockProvider, groupSize)
      const walletAddresses = Array.from({ length: 7 }, (_, i) => `0x${i.toString(16)}`)

      const resolvers: Array<() => void> = []
      const mockTokenContract = {
        balanceOf: () => {
          const [promise, resolve] = deferredPromise()
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
          const count = resolvers.length
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
        latestAnswer: deferred(1235n),
      }
      ethersNewContract.mockReturnValueOnce(mockPriceOracleContract)
      const groupedPriceOracleContract =
        groupedProvider.createPriceOracleContract(priceOracleAddress)

      groupedTokenContract.decimals()
      groupedPriceOracleContract.decimals()
      groupedTokenContract.balanceOf('0x1234')

      groupedTokenContract.getWithdrawalQueueLength()
      groupedTokenContract.getWithdrawalQueueInfo(0n)
      groupedPriceOracleContract.latestAnswer()

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
})
