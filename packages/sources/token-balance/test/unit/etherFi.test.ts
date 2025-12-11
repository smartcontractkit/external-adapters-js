jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => {
  return {
    SubscriptionTransport: class {},
  }
})

import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { ethers } from 'ethers'
import { inputParameters } from '../../src/endpoint/etherFi'
import { EtherFiBalanceTransport } from '../../src/transport/etherFi'

const SPLIT_MAIN_ADDRESS = '0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE'
const SPLIT_MAIN_ACCOUNT = '0xF00baa0000000000000000000000000000000001'
const EIGEN_STRATEGY_ADDRESS = '0x93c4b944D05dfe6df7645A86cd2206016c51564D'
const EIGEN_STRATEGY_USER = '0x1FfAB368Bb0a2b55c643fBeF847c881C6f7f5F01'
const DEFAULT_EIGENPOD_MANAGER = '0x39052978723eB8d29c7aE967d0a95aebF71737A7'
const CUSTOM_EIGENPOD_MANAGER = '0x0000000000000000000000000000000000000002'

let contractMap: Record<string, unknown> = {}

const registerContract = (address: string, implementation: unknown) => {
  contractMap[address.toLowerCase()] = implementation
}

const getRegisteredContract = (address: string) => {
  const contract = contractMap[address.toLowerCase()]
  if (!contract) {
    throw new Error(`Contract not found: ${address}`)
  }
  return contract
}

const createProvider = () =>
  makeStub('provider', {
    getBalance: jest.fn(),
  })
let mockProvider = createProvider()

const makeEthers = () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => {
    mockProvider = createProvider()
    return mockProvider
  }),
  Contract: function (address: string) {
    return getRegisteredContract(address)
  },
  toBigInt: (value: ethers.BigNumberish) => BigInt(value as bigint | number | string),
})

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

describe('EtherFiBalanceTransport', () => {
  const buildParams = (overrides: Partial<typeof inputParameters.validated> = {}) =>
    makeStub('params', {
      splitMain: SPLIT_MAIN_ADDRESS,
      splitMainAccount: SPLIT_MAIN_ACCOUNT,
      eigenStrategy: EIGEN_STRATEGY_ADDRESS,
      eigenStrategyUser: EIGEN_STRATEGY_USER,
      eigenPodManager: DEFAULT_EIGENPOD_MANAGER,
      ...overrides,
    })

  let transport: EtherFiBalanceTransport

  beforeEach(() => {
    contractMap = {}
    transport = new EtherFiBalanceTransport()
    jest.clearAllMocks()
    transport.provider = mockProvider as ethers.JsonRpcProvider
  })

  it('returns only active strategy shares when there are no queued withdrawals', async () => {
    const splitMainBalance = 1_000n
    const strategyShares = 250n
    const eigenBalance = 10_000n

    const splitMainContract = {
      getETHBalance: jest.fn().mockResolvedValue(splitMainBalance),
    }
    const eigenStrategyContract = {
      shares: jest.fn().mockResolvedValue(strategyShares),
      sharesToUnderlyingView: jest.fn().mockResolvedValue(eigenBalance),
    }
    const eigenPodManagerContract = {
      getQueuedWithdrawals: jest.fn().mockResolvedValue({ shares: [] as bigint[][] }),
    }

    registerContract(SPLIT_MAIN_ADDRESS, splitMainContract)
    registerContract(EIGEN_STRATEGY_ADDRESS, eigenStrategyContract)
    registerContract(DEFAULT_EIGENPOD_MANAGER, eigenPodManagerContract)

    const response = await transport._handleRequest(buildParams())

    expect(splitMainContract.getETHBalance).toHaveBeenCalledWith(SPLIT_MAIN_ACCOUNT)
    expect(eigenStrategyContract.shares).toHaveBeenCalledWith(EIGEN_STRATEGY_USER)
    expect(eigenStrategyContract.sharesToUnderlyingView).toHaveBeenCalledWith(strategyShares)
    expect(eigenPodManagerContract.getQueuedWithdrawals).toHaveBeenCalledWith(EIGEN_STRATEGY_USER)

    const expectedResult = (splitMainBalance + eigenBalance).toString()
    expect(response.statusCode).toBe(200)
    expect(response.result).toBe(expectedResult)
    expect(response.data).toBeDefined()
    expect(response.data!.result).toBe(expectedResult)
    expect(response.data!.decimals).toBe(18)
  })

  it('adds queued withdrawal shares before conversion to underlying balance', async () => {
    const splitMainBalance = 0n
    const strategyShares = 50n
    const queuedShares = [[5n, 10n], [], [2n]]
    const queuedSum = 17n
    const convertedBalance = 12_345n

    const splitMainContract = {
      getETHBalance: jest.fn().mockResolvedValue(splitMainBalance),
    }
    const eigenStrategyContract = {
      shares: jest.fn().mockResolvedValue(strategyShares),
      sharesToUnderlyingView: jest.fn().mockResolvedValue(convertedBalance),
    }
    const eigenPodManagerContract = {
      getQueuedWithdrawals: jest.fn().mockResolvedValue({ shares: queuedShares }),
    }

    registerContract(SPLIT_MAIN_ADDRESS, splitMainContract)
    registerContract(EIGEN_STRATEGY_ADDRESS, eigenStrategyContract)
    registerContract(CUSTOM_EIGENPOD_MANAGER, eigenPodManagerContract)

    const response = await transport._handleRequest(
      buildParams({ eigenPodManager: CUSTOM_EIGENPOD_MANAGER }),
    )

    expect(eigenPodManagerContract.getQueuedWithdrawals).toHaveBeenCalledWith(EIGEN_STRATEGY_USER)
    expect(eigenStrategyContract.sharesToUnderlyingView).toHaveBeenCalledWith(
      strategyShares + queuedSum,
    )

    const expectedResult = (splitMainBalance + convertedBalance).toString()
    expect(response.result).toBe(expectedResult)
  })
})
