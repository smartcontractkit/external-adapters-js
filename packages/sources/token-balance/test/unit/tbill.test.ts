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

const TokenSymbol = 'TBILL'
const RESULT_DECIMALS = 18

const createRoundData = ({ price, priceDecimals }: { price: number; priceDecimals: number }) => {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return [
    1n, // roundId
    BigInt(price * 10 ** priceDecimals), // answer
    now, // startedAt
    now, // updatedAt
    1n, // answeredInRound
  ]
}

const createMockTokenContract = () => ({
  decimals: jest.fn(),
  getWithdrawalQueueLength: jest.fn(),
  getWithdrawalQueueInfo: jest.fn(),
  balanceOf: jest.fn(),
})

const createMockPriceContract = () => ({
  decimals: jest.fn(),
  latestRoundData: jest.fn(),
})

const ethTbillContract = createMockTokenContract()
const ethTbillPriceContract = createMockPriceContract()
const arbTbillContract = createMockTokenContract()
const arbTbillPriceContract = createMockPriceContract()

const contracts: Record<string, unknown> = {
  [ETHEREUM_TBILL_CONTRACT_ADDRESS]: ethTbillContract,
  [ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS]: ethTbillPriceContract,
  [ARBITRUM_TBILL_CONTRACT_ADDRESS]: arbTbillContract,
  [ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS]: arbTbillPriceContract,
}

const makeEthers = () => {
  return {
    JsonRpcProvider: jest.fn(),
    Contract: function (address: string) {
      if (!(address in contracts)) {
        throw new Error(`Contract not found: ${address}`)
      }
      return contracts[address]
    },
  }
}

jest.mock('ethers', () => ({
  ethers: makeEthers(),
}))

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('TbillTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'tbill'
  const BACKGROUND_EXECUTE_MS = 1500
  const GROUP_SIZE = 3

  const adapterSettings = {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    ETHEREUM_RPC_URL: 'https://eth.rpc.url',
    ARBITRUM_RPC_URL: 'https://arb.rpc.url',
    ETHEREUM_RPC_CHAIN_ID,
    ARBITRUM_RPC_CHAIN_ID,
    BACKGROUND_EXECUTE_MS,
    GROUP_SIZE,
  } as unknown as BaseEndpointTypes['Settings']

  const context = {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>

  const responseCache = {
    write: jest.fn(),
  }

  let transport: TbillTransport

  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new TbillTransport()

    const dependencies = {
      responseCache,
      subscriptionSetFactory: {
        buildSet: jest.fn(),
      },
    } as unknown as TransportDependencies<BaseEndpointTypes>
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
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(1)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(1)

      expect(arbTbillContract.balanceOf).toBeCalledTimes(0)
      expect(arbTbillPriceContract.latestRoundData).toBeCalledTimes(0)

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
      arbTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param = {
        addresses: [
          {
            chainId: ARBITRUM_RPC_CHAIN_ID,
            contractAddress: ARBITRUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(arbTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(arbTbillContract.balanceOf).toBeCalledTimes(1)
      expect(arbTbillPriceContract.latestRoundData).toBeCalledTimes(1)

      expect(ethTbillContract.balanceOf).toBeCalledTimes(0)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(0)

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
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price: ethTbillPrice, priceDecimals: ethTbillPriceDecimals }),
      )

      arbTbillContract.decimals.mockResolvedValue(arbTbillBalanceDecimals)
      arbTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(arbTbillBalance1 * 10 ** arbTbillBalanceDecimals),
      )
      arbTbillContract.balanceOf.mockResolvedValueOnce(
        BigInt(arbTbillBalance2 * 10 ** arbTbillBalanceDecimals),
      )
      arbTbillPriceContract.decimals.mockResolvedValue(arbTbillPriceDecimals)
      arbTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price: arbTbillPrice, priceDecimals: arbTbillPriceDecimals }),
      )

      const param = {
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
      } as RequestParams

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toHaveBeenNthCalledWith(1, ethWalletAddress1)
      expect(ethTbillContract.balanceOf).toHaveBeenNthCalledWith(2, ethWalletAddress2)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(2)
      // TODO: Do we really need 2 calls to the price contract?
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(2)

      expect(arbTbillContract.balanceOf).toHaveBeenNthCalledWith(1, arbWalletAddress1)
      expect(arbTbillContract.balanceOf).toHaveBeenNthCalledWith(2, arbWalletAddress2)
      expect(arbTbillContract.balanceOf).toBeCalledTimes(2)
      // TODO: Do we really need 2 calls to the price contract?
      expect(arbTbillPriceContract.latestRoundData).toBeCalledTimes(2)

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
      const [decimalsPromise, decimalsResolve] = deferredPromise()
      const resolve = () => decimalsResolve(balanceDecimals)
      ethTbillContract.decimals.mockResolvedValue(decimalsPromise)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

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
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

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
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param = {
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
      } as RequestParams

      const now = Date.now()
      await transport.handleRequest(context, param)

      expect(ethTbillContract.balanceOf).toBeCalledWith(walletAddress)
      expect(ethTbillContract.balanceOf).toBeCalledTimes(1)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(1)

      expect(arbTbillContract.balanceOf).toBeCalledTimes(0)
      expect(arbTbillPriceContract.latestRoundData).toBeCalledTimes(0)

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
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce({
        sender: walletAddress,
        receiver: walletAddress,
        shares: BigInt(withDrawalQueueAmount1 * 10 ** balanceDecimals),
      })
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce({
        sender: walletAddress,
        receiver: walletAddress,
        shares: BigInt(withDrawalQueueAmount2 * 10 ** balanceDecimals),
      })

      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param: RequestParams = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            token: TokenSymbol,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

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

    it('should ignore withdrawal queue entries unless both sender and receiver equal the wallet address', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const withDrawalQueueAmount1 = 1
      const withDrawalQueueAmount2 = 2
      const withDrawalQueueAmount3 = 3

      const result = String(balance * price * 10 ** RESULT_DECIMALS)

      const walletAddress = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValue(BigInt(balance * 10 ** balanceDecimals))
      ethTbillContract.getWithdrawalQueueLength.mockResolvedValue(3)
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce({
        sender: '0x01',
        receiver: walletAddress,
        shares: BigInt(withDrawalQueueAmount1 * 10 ** balanceDecimals),
      })
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce({
        sender: walletAddress,
        receiver: '0x02',
        shares: BigInt(withDrawalQueueAmount2 * 10 ** balanceDecimals),
      })
      ethTbillContract.getWithdrawalQueueInfo.mockResolvedValueOnce({
        sender: '0x03',
        receiver: '0x04',
        shares: BigInt(withDrawalQueueAmount3 * 10 ** balanceDecimals),
      })

      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param: RequestParams = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            token: TokenSymbol,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ],
      } as RequestParams

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
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledWith(2)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledTimes(3)
    })

    it('should not double count withdrawal queue entries for multiple addresses', async () => {
      const balance1 = 3
      const balance2 = 5
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const withDrawalQueueAmount1 = 1
      const withDrawalQueueAmount2 = 2

      const result = String(
        (balance1 + balance2 + withDrawalQueueAmount1 + withDrawalQueueAmount2) *
          price *
          10 ** RESULT_DECIMALS,
      )

      const walletAddress1 = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      const walletAddress2 = '0x1000000000000000000000000000000000000001'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValueOnce(BigInt(balance1 * 10 ** balanceDecimals))
      ethTbillContract.balanceOf.mockResolvedValueOnce(BigInt(balance2 * 10 ** balanceDecimals))
      ethTbillContract.getWithdrawalQueueLength.mockResolvedValue(2)
      const withDrawalQueueEntries = [
        {
          sender: walletAddress1,
          receiver: walletAddress1,
          shares: BigInt(withDrawalQueueAmount1 * 10 ** balanceDecimals),
        },
        {
          sender: walletAddress2,
          receiver: walletAddress2,
          shares: BigInt(withDrawalQueueAmount2 * 10 ** balanceDecimals),
        },
      ]
      ethTbillContract.getWithdrawalQueueInfo.mockImplementation(
        async (index: number) => withDrawalQueueEntries[index],
      )

      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param: RequestParams = {
        addresses: [walletAddress1, walletAddress2].map((walletAddress) => ({
          chainId: ETHEREUM_RPC_CHAIN_ID,
          contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
          token: TokenSymbol,
          priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
          wallets: [walletAddress],
        })),
      } as RequestParams

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

      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(2)
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(1, 0)
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(2, 1)
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(3, 0)
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(4, 1)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledTimes(4)
    })

    // The previous test tests input with multiple address entries with 1 wallet each.
    // This test tests input with one address entries with multiple wallets.
    it('should not double count withdrawal queue entries for multiple wallets', async () => {
      const balance1 = 3
      const balance2 = 5
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8
      const withDrawalQueueAmount1 = 1
      const withDrawalQueueAmount2 = 2

      const result = String(
        (balance1 + balance2 + withDrawalQueueAmount1 + withDrawalQueueAmount2) *
          price *
          10 ** RESULT_DECIMALS,
      )

      const walletAddress1 = '0x5EaFF7af80488033Bc845709806D5Fae5291eB88'
      const walletAddress2 = '0x1000000000000000000000000000000000000001'
      ethTbillContract.decimals.mockResolvedValue(balanceDecimals)
      ethTbillContract.balanceOf.mockResolvedValueOnce(BigInt(balance1 * 10 ** balanceDecimals))
      ethTbillContract.balanceOf.mockResolvedValueOnce(BigInt(balance2 * 10 ** balanceDecimals))
      ethTbillContract.getWithdrawalQueueLength.mockResolvedValue(2)
      const withDrawalQueueEntries = [
        {
          sender: walletAddress1,
          receiver: walletAddress1,
          shares: BigInt(withDrawalQueueAmount1 * 10 ** balanceDecimals),
        },
        {
          sender: walletAddress2,
          receiver: walletAddress2,
          shares: BigInt(withDrawalQueueAmount2 * 10 ** balanceDecimals),
        },
      ]
      ethTbillContract.getWithdrawalQueueInfo.mockImplementation(
        async (index: number) => withDrawalQueueEntries[index],
      )

      ethTbillPriceContract.decimals.mockResolvedValue(priceDecimals)
      ethTbillPriceContract.latestRoundData.mockResolvedValue(
        createRoundData({ price, priceDecimals }),
      )

      const param: RequestParams = {
        addresses: [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            token: TokenSymbol,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress1, walletAddress2],
          },
        ],
      } as RequestParams

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
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(1, 0)
      expect(ethTbillContract.getWithdrawalQueueInfo).toHaveBeenNthCalledWith(2, 1)
      expect(ethTbillContract.getWithdrawalQueueInfo).toBeCalledTimes(2)
    })

    it('should limit concurrent RPCs', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8

      const walletAddress1 = '0x10AFF7AF80488033BC845709806D5FAE5291EB01'
      const walletAddress2 = '0x20AFF7AF80488033BC845709806D5FAE5291EB02'

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

      ethTbillContract.decimals.mockImplementation(deferred(balanceDecimals))
      ethTbillContract.balanceOf.mockImplementation(
        deferred(BigInt(balance * 10 ** balanceDecimals)),
      )
      ethTbillPriceContract.decimals.mockImplementation(deferred(priceDecimals))
      ethTbillPriceContract.latestRoundData.mockImplementation(
        deferred(createRoundData({ price, priceDecimals })),
      )
      ethTbillContract.getWithdrawalQueueLength.mockImplementation(deferred(0))

      const param = {
        addresses: [walletAddress1, walletAddress2].map((walletAddress) => ({
          chainId: ETHEREUM_RPC_CHAIN_ID,
          contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
          token: TokenSymbol,
          priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
          wallets: [walletAddress],
        })),
      } as RequestParams

      transport.handleRequest(context, param)

      // We expect 5 RPCs per address:
      // 1. ethTbillContract.decimals
      // 2. ethTbillContract.balanceOf
      // 5. ethTbillContract.getWithdrawalQueueLength
      // 3. ethTbillPriceContract.decimals
      // 4. ethTbillPriceContract.latestRoundData
      //
      // So for 2 addresses we expect 10 RPCs. With a group size of 3, we
      // should have 4 batches of sizes 3, 3, 3, and 1.
      const expectAndResolve = async (expectedCount: number) => {
        await jest.runAllTimersAsync()
        expect(resolvers).toHaveLength(expectedCount)
        resolvers.forEach((resolve) => resolve())
        resolvers.length = 0
      }

      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(1)

      expect(log).not.toBeCalled()
      expect(ethTbillContract.balanceOf).toBeCalledTimes(2)
      expect(ethTbillContract.decimals).toBeCalledTimes(2)
      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(2)
      expect(ethTbillPriceContract.decimals).toBeCalledTimes(2)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(2)
    })

    it('should limit concurrent RPCs per provider', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8

      const walletAddress1 = '0x10AFF7AF80488033BC845709806D5FAE5291EB01'
      const walletAddress2 = '0x20AFF7AF80488033BC845709806D5FAE5291EB02'

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

      ethTbillContract.decimals.mockImplementation(deferred(balanceDecimals))
      ethTbillContract.balanceOf.mockImplementation(
        deferred(BigInt(balance * 10 ** balanceDecimals)),
      )
      ethTbillPriceContract.decimals.mockImplementation(deferred(priceDecimals))
      ethTbillPriceContract.latestRoundData.mockImplementation(
        deferred(createRoundData({ price, priceDecimals })),
      )
      ethTbillContract.getWithdrawalQueueLength.mockImplementation(deferred(0))

      arbTbillContract.decimals.mockImplementation(deferred(balanceDecimals))
      arbTbillContract.balanceOf.mockImplementation(
        deferred(BigInt(balance * 10 ** balanceDecimals)),
      )
      arbTbillPriceContract.decimals.mockImplementation(deferred(priceDecimals))
      arbTbillPriceContract.latestRoundData.mockImplementation(
        deferred(createRoundData({ price, priceDecimals })),
      )
      arbTbillContract.getWithdrawalQueueLength.mockImplementation(deferred(0))

      const param = {
        addresses: [walletAddress1, walletAddress2].flatMap((walletAddress) => [
          {
            chainId: ETHEREUM_RPC_CHAIN_ID,
            contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
            token: TokenSymbol,
            priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
          {
            chainId: ARBITRUM_RPC_CHAIN_ID,
            contractAddress: ARBITRUM_TBILL_CONTRACT_ADDRESS,
            token: TokenSymbol,
            priceOracleAddress: ARBITRUM_TBILL_PRICE_ORACLE_ADDRESS,
            wallets: [walletAddress],
          },
        ]),
      } as RequestParams

      transport.handleRequest(context, param)

      // We expect 5 RPCs per address:
      // 1. ethTbillContract.decimals
      // 2. ethTbillContract.balanceOf
      // 5. ethTbillContract.getWithdrawalQueueLength
      // 3. ethTbillPriceContract.decimals
      // 4. ethTbillPriceContract.latestRoundData
      //
      // So for 4 addresses we expect 20 RPCs. With a group size of 3 but a
      // separate group size per provider, we should have 4 batches of sizes 6,
      // 6, 6, and 2.
      const expectAndResolve = async (expectedCount: number) => {
        await jest.runAllTimersAsync()
        expect(resolvers).toHaveLength(expectedCount)
        resolvers.forEach((resolve) => resolve())
        resolvers.length = 0
      }

      await expectAndResolve(6)
      await expectAndResolve(6)
      await expectAndResolve(6)
      await expectAndResolve(2)

      expect(log).not.toBeCalled()
      expect(ethTbillContract.balanceOf).toBeCalledTimes(2)
      expect(ethTbillContract.decimals).toBeCalledTimes(2)
      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(2)
      expect(ethTbillPriceContract.decimals).toBeCalledTimes(2)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(2)

      expect(arbTbillContract.balanceOf).toBeCalledTimes(2)
      expect(arbTbillContract.decimals).toBeCalledTimes(2)
      expect(arbTbillContract.getWithdrawalQueueLength).toBeCalledTimes(2)
      expect(arbTbillPriceContract.decimals).toBeCalledTimes(2)
      expect(arbTbillPriceContract.latestRoundData).toBeCalledTimes(2)
    })

    it('should reset RPC grouping for a new request', async () => {
      const balance = 3
      const balanceDecimals = 6
      const price = 7
      const priceDecimals = 8

      const walletAddress1 = '0x10AFF7AF80488033BC845709806D5FAE5291EB01'
      const walletAddress2 = '0x20AFF7AF80488033BC845709806D5FAE5291EB02'

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

      ethTbillContract.decimals.mockImplementation(deferred(balanceDecimals))
      ethTbillContract.balanceOf.mockImplementation(
        deferred(BigInt(balance * 10 ** balanceDecimals)),
      )
      ethTbillPriceContract.decimals.mockImplementation(deferred(priceDecimals))
      ethTbillPriceContract.latestRoundData.mockImplementation(
        deferred(createRoundData({ price, priceDecimals })),
      )
      ethTbillContract.getWithdrawalQueueLength.mockImplementation(deferred(0))

      const param = {
        addresses: [walletAddress1, walletAddress2].map((walletAddress) => ({
          chainId: ETHEREUM_RPC_CHAIN_ID,
          contractAddress: ETHEREUM_TBILL_CONTRACT_ADDRESS,
          token: TokenSymbol,
          priceOracleAddress: ETHEREUM_TBILL_PRICE_ORACLE_ADDRESS,
          wallets: [walletAddress],
        })),
      } as RequestParams

      transport.handleRequest(context, param)

      // We expect 5 RPCs per address:
      // 1. ethTbillContract.decimals
      // 2. ethTbillContract.balanceOf
      // 5. ethTbillContract.getWithdrawalQueueLength
      // 3. ethTbillPriceContract.decimals
      // 4. ethTbillPriceContract.latestARoundData
      //
      // So for 2 addresses we expect 10 RPCs. With a group size of 3, we
      // should have 4 batches of sizes 3, 3, 3, and 1.
      const expectAndResolve = async (expectedCount: number) => {
        await jest.runAllTimersAsync()
        expect(resolvers).toHaveLength(expectedCount)
        resolvers.forEach((resolve) => resolve())
        resolvers.length = 0
      }

      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(1)

      expect(log).not.toBeCalled()
      expect(ethTbillContract.balanceOf).toBeCalledTimes(2)
      expect(ethTbillContract.decimals).toBeCalledTimes(2)
      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(2)
      expect(ethTbillPriceContract.decimals).toBeCalledTimes(2)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(2)

      // When we make a new request, it should start with another group of 3,
      // rather than just 2, which might happen if we reuse the same
      // GroupRunner than ended with a group of 1 before.
      transport.handleRequest(context, param)

      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(3)
      await expectAndResolve(1)

      expect(log).not.toBeCalled()
      expect(ethTbillContract.balanceOf).toBeCalledTimes(4)
      expect(ethTbillContract.decimals).toBeCalledTimes(4)
      expect(ethTbillContract.getWithdrawalQueueLength).toBeCalledTimes(4)
      expect(ethTbillPriceContract.decimals).toBeCalledTimes(4)
      expect(ethTbillPriceContract.latestRoundData).toBeCalledTimes(4)
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
