// Must be first so it can be used from jest.mock, which is hoisted to the top.
import { makeStub } from './util'

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider, deferredPromise } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/tbill'
import { TbillTransport } from '../../src/transport/tbill'

type RequestParams = typeof inputParameters.validated

const ETHEREUM_RPC_CHAIN_ID = '1'
const ETHEREUM_TBILL_CONTRACT_ADDRESS = '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a'
const ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS = '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40'

const ARBITRUM_RPC_CHAIN_ID = '42161'
const ARBITRUM_TBILL_CONTRACT_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS = '0xc0952c8ba068c887B675B4182F3A65420D045F46'

const BASE_RPC_CHAIN_ID = '8453'
const BASE_TBILL_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BASE_TBILL_PRICE_ORACLE_ADDRESS = 'unknown'

const RESULT_DECIMALS = 18

const createMockTokenContract = () => ({
  decimals: jest.fn(),
  getWithdrawalQueueLength: jest.fn(),
  getWithdrawalQueueInfo: jest.fn(),
  balanceOf: jest.fn(),
})

const createMockPriceContract = () => ({
  decimals: jest.fn(),
  latestAnswer: jest.fn(),
})

const ethTbillContract = createMockTokenContract()
const ethTbillPriceContract = createMockPriceContract()
const arbTbillContract = createMockTokenContract()
const arbTbillPriceContract = createMockPriceContract()

const contracts = makeStub('contracts', {
  [ETHEREUM_TBILL_CONTRACT_ADDRESS]: ethTbillContract,
  [ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS]: ethTbillPriceContract,
  [ARBITRUM_TBILL_CONTRACT_ADDRESS]: arbTbillContract,
  [ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS]: arbTbillPriceContract,
})

const makeEthers = () => {
  return makeStub('ethers', {
    JsonRpcProvider: jest.fn(),
    Contract: function (address) {
      return contracts[address]
    },
  })
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

const log = jest.fn()
const logger = makeStub('logger', {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
})

const loggerFactory = makeStub('loggerFactory', { child: () => logger })

LoggerFactoryProvider.set(loggerFactory)

describe('TbillTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'tbill'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    ETHEREUM_RPC_URL: 'https://eth.rpc.url',
    ARBITRUM_RPC_URL: 'https://arb.rpc.url',
    ETHEREUM_RPC_CHAIN_ID,
    ARBITRUM_RPC_CHAIN_ID,
    BACKGROUND_EXECUTE_MS,
  } as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  let transport: TbillTransport
  let responseCache = {
    write: jest.fn(),
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new TbillTransport()

    const subscriptionSet = makeStub('subscriptionSet', {})
    const dependencies = makeStub('dependencies', {
      responseCache,
      subscriptionSetFactory: {
        buildSet: () => subscriptionSet,
      },
    } as unknown as TransportDependencies<BaseEndpointTypes>)
    transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('handleRequest', () => {
    it('should cache ethereum tbill balance', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const result = String(balance * price * 10 ** RESULT_DECIMALS)

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(1)
      expect(ethTbillPriceContract.latestAnswer).toBeCalledTimes(1)

      expect(arbTbillContract.balanceOf).toBeCalledTimes(0)
      expect(arbTbillPriceContract.latestAnswer).toBeCalledTimes(0)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('should cache arbitrum tbill balance', async () => {
      const balance = 4
      const balanceDecimals = 7
      const price = 9
      const priceDecimals = 10
      const result = String(balance * price * 10 ** RESULT_DECIMALS)

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      arbTbillContract.decimals.mockResolvedValue(balanceDecimals)
      arbTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      arbTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      arbTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ARBITRUM_RPC_CHAIN_ID,
            contractAddress: ARBITRUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(arbTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(arbTbillContract.balanceOf).toBeCalledTimes(1)
      expect(arbTbillPriceContract.latestAnswer).toBeCalledTimes(1)

      expect(ethTbillContract.balanceOf).toBeCalledTimes(0)
      expect(ethTbillPriceContract.latestAnswer).toBeCalledTimes(0)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('should add up multiple balances', async () => {
      const ethTbillBalance1 = 3
      const ethTbillBalance2 = 4
      const ethTbillBalanceDecimals = 6
      const totalEthTbillBalance = ethTbillBalance1 + ethTbillBalance2

      const ethTbillPrice = 7.01
      const ethTbillPriceDecimals = 8

      const arbTbillBalance1 = 3
      const arbTbillBalance2 = 4
      const arbTbillBalanceDecimals = 7
      const totalArbTbillBalance = arbTbillBalance1 + arbTbillBalance2

      const arbTbillPrice = 7.02
      const arbTbillPriceDecimals = 9

      const result = String(
        BigInt(
          (totalEthTbillBalance * ethTbillPrice + totalArbTbillBalance * arbTbillPrice) *
            10 ** RESULT_DECIMALS,
        ),
      )

      const ethWalletAddress1 = '0x01'
      const ethWalletAddress2 = '0x02'
      const arbWalletAddress1 = '0x03'
      const arbWalletAddress2 = '0x04'

      ethTbillContract.decimals.mockResolvedValue(ethTbillBalanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(ethTbillBalance1 * 10 ** ethTbillBalanceDecimals),
      )
      ethTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(ethTbillBalance2 * 10 ** ethTbillBalanceDecimals),
      )
      ethTbillPriceContract.decimals.mockResolvedValue(ethTbillPriceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(
        BigInt(ethTbillPrice * 10 ** ethTbillPriceDecimals),
      )

      arbTbillContract.decimals.mockResolvedValue(arbTbillBalanceDecimals)
      arbTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(arbTbillBalance1 * 10 ** arbTbillBalanceDecimals),
      )
      arbTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(arbTbillBalance2 * 10 ** arbTbillBalanceDecimals),
      )
      arbTbillPriceContract.decimals.mockResolvedValue(arbTbillPriceDecimals)
      arbTbillPriceContract.latestAnswer.mockResolvedValue(
        BigInt(arbTbillPrice * 10 ** arbTbillPriceDecimals),
      )

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [ethWalletAddress1],
          },
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [ethWalletAddress2],
          },
          {
            chainId: ARBITRUM_RPC_CHAIN_ID,
            contractAddress: ARBITRUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [arbWalletAddress1],
          },
          {
            chainId: ARBITRUM_RPC_CHAIN_ID,
            contractAddress: ARBITRUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [arbWalletAddress2],
          },
        ],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toHaveBeenNthCalledWith(1, ethWalletAddress1)
      expect(ethTbillContract.balanceOf).toHaveBeenNthCalledWith(2, ethWalletAddress2)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(2)
      // TODO: Do we really need 2 calls to the price contract?
      expect(ethTbillPriceContract.latestAnswer).toBeCalledTimes(2)

      expect(arbTbillContract.balanceOf).toHaveBeenNthCalledWith(1, arbWalletAddress1)
      expect(arbTbillContract.balanceOf).toHaveBeenNthCalledWith(2, arbWalletAddress2)
      expect(arbTbillContract.balanceOf).toBeCalledTimes(2)
      // TODO: Do we really need 2 calls to the price contract?
      expect(arbTbillPriceContract.latestAnswer).toBeCalledTimes(2)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const result = String(balance * price * 10 ** RESULT_DECIMALS)

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      let [decimalsPromise, decimalsResolve] = deferredPromise()
      const resolve = () => decimalsResolve(balanceDecimals)
      ethTbillContract.decimals.mockResolvedValue(decimalsPromise)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      const requestTimestamp = Date.now()
      const requestPromise = transport.handleRequest(context, param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolve()
      await requestPromise

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: requestTimestamp,
              providerDataReceivedUnixMs: responseTimestamp,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('should log error', async () => {
      const errorMessage = 'test error'
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      ethTbillContract.decimals.mockRejectedValue(new Error('test error'))
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      await transport.handleRequest(context, param)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            errorMessage: errorMessage,
            statusCode: 502,
            timestamps: {
              providerDataRequestedUnixMs: 0,
              providerDataReceivedUnixMs: 0,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)

      expect(log).toBeCalledWith(new Error(errorMessage), errorMessage)
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should ignore chain other than ethereum or arbitrum', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const result = String(balance * price * 10 ** RESULT_DECIMALS)

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
          {
            chainId: BASE_RPC_CHAIN_ID,
            contractAddress: BASE_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: BASE_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(1)
      expect(ethTbillPriceContract.latestAnswer).toBeCalledTimes(1)

      expect(arbTbillContract.balanceOf).toBeCalledTimes(0)
      expect(arbTbillPriceContract.latestAnswer).toBeCalledTimes(0)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('add withdrawal queue amount to wallet balance', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const withDrawalQueueAmount1 = 1
      const withDrawalQueueAmount2 = 2

      const result = String(
        (balance + withDrawalQueueAmount1 + withDrawalQueueAmount2) * price * 10 ** RESULT_DECIMALS,
      )

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillContract.getWithdrawalQueueLength.mockResolvedValue(2)
      // TODO: Shouldn't we only count withdrawals from walletAddress?
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce(
        makeStub('withdrawalQueueInfo1', {
          sender: '0x01',
          receiver: '0x02',
          shares: BigInt(withDrawalQueueAmount1 * 10 ** balanceDecimals),
        }),
      )
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce(
        makeStub('withdrawalQueueInfo2', {
          sender: '0x03',
          receiver: '0x04',
          shares: BigInt(withDrawalQueueAmount2 * 10 ** balanceDecimals),
        }),
      )

      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestAnswer.mockResolvedValue(BigInt(price * 10 ** priceDecimals))

      const param = makeStub('param', {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams)

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            data: {
              decimals: RESULT_DECIMALS,
              result,
            },
            result,
            statusCode: 200,
            timestamps: {
              providerDataRequestedUnixMs: now,
              providerDataReceivedUnixMs: now,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)

      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(1)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledWith(0)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledWith(1)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledTimes(2)
    })
  })

  describe('backgroundHandler', () => {
    it('should sleep after handleRequest', async () => {
      const t0 = Date.now()
      let t1 = 0
      transport.backgroundHandler(context, []).then(() => {
        t1 = Date.now()
      })
      await jest.runAllTimersAsync()
      expect(t1 - t0).toBe(BACKGROUND_EXECUTE_MS)
    })
  })
})
