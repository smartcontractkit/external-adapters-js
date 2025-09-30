import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { PublicKey } from '@solana/web3.js'
import { BaseEndpointTypes } from '../../src/endpoint/solana-balance'
import { SolanaBalanceTransport } from '../../src/transport/solana-balance'

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

const RESULT_DECIMALS = 9

const connectionGetAccountInfo = jest.fn()

const createFakePublicKey = (address: string) =>
  ({
    publicKey: address,
  } as unknown as PublicKey)

const makeSolanaWeb3 = () => {
  return {
    PublicKey: function (address: string): PublicKey {
      return createFakePublicKey(address)
    },
    Connection: class {
      async getAccountInfo(publicKey: PublicKey) {
        return connectionGetAccountInfo(publicKey)
      }
    },
  }
}

jest.mock('@solana/web3.js', () => makeSolanaWeb3())

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

describe('SolanaBalanceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'solana-balance'
  const SOLANA_RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const GROUP_SIZE = 3

  const adapterSettings = makeStub('adapterSettings', {
    SOLANA_RPC_URL,
    SOLANA_COMMITMENT: 'finalized',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    GROUP_SIZE,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: SolanaBalanceTransport

  const mockAccountInfo = (balance: number | Promise<number>) => {
    connectionGetAccountInfo.mockImplementationOnce(async () => {
      return {
        lamports: await balance,
      }
    })
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new SolanaBalanceTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
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

  describe('handleRequest', () => {
    it('should cache response', async () => {
      const address = 'r101'
      const balance = 123

      mockAccountInfo(balance)

      const param = makeStub('param', {
        addresses: [{ address }],
      })
      await transport.handleRequest(context, param)

      const expectedResult = [
        {
          address,
          balance: balance.toString(),
        },
      ]

      const expectedResponse = {
        statusCode: 200,
        result: null,
        data: {
          decimals: RESULT_DECIMALS,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return balances', async () => {
      const address1 = 'r101'
      const address2 = 'r102'
      const balance1 = 100
      const balance2 = 200

      mockAccountInfo(balance1)
      mockAccountInfo(balance2)

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
      })
      const response = await transport._handleRequest(param)

      const expectedResult = [
        {
          address: address1,
          balance: balance1.toString(),
        },
        {
          address: address2,
          balance: balance2.toString(),
        },
      ]
      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: RESULT_DECIMALS,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const address = 'r101'
      const balance = 100

      const [balancePromise, resolveBalance] = deferredPromise<number>()
      mockAccountInfo(balancePromise)

      const param = makeStub('param', {
        addresses: [{ address }],
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveBalance(balance)

      const expectedResult = [
        {
          address,
          balance: balance.toString(),
        },
      ]
      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: RESULT_DECIMALS,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      log.mockClear()
    })
  })

  describe('getTotalTokenBalance', () => {
    it('should return the token balance of multiple addresses', async () => {
      const address1 = 'r101'
      const address2 = 'r102'
      mockAccountInfo(100)
      mockAccountInfo(200)

      const balances = await transport.getTokenBalances([
        { address: address1 },
        { address: address2 },
      ])

      expect(balances).toEqual([
        { address: address1, balance: '100' },
        { address: address2, balance: '200' },
      ])

      expect(connectionGetAccountInfo).toHaveBeenNthCalledWith(1, createFakePublicKey(address1))
      expect(connectionGetAccountInfo).toHaveBeenNthCalledWith(2, createFakePublicKey(address2))
      expect(connectionGetAccountInfo).toBeCalledTimes(2)
    })

    it('should wait for the first group of RPCs to finish before sending the next group', async () => {
      const [balance1, resolveLines1] = deferredPromise<number>()
      const [balance2, resolveLines2] = deferredPromise<number>()
      const [balance3, resolveLines3] = deferredPromise<number>()
      const [balance4, resolveLines4] = deferredPromise<number>()

      const address1 = 'r101'
      const address2 = 'r102'
      const address3 = 'r103'
      const address4 = 'r104'
      mockAccountInfo(balance1)
      mockAccountInfo(balance2)
      mockAccountInfo(balance3)
      mockAccountInfo(balance4)

      const balancePromise = transport.getTokenBalances([
        { address: address1 },
        { address: address2 },
        { address: address3 },
        { address: address4 },
      ])

      await jest.runAllTimersAsync()

      // Only 3 of the 4 requests were made because GROUP_SIZE is 3
      expect(connectionGetAccountInfo).toBeCalledTimes(3)

      resolveLines1(101.0)
      resolveLines2(102.0)

      await jest.runAllTimersAsync()
      expect(connectionGetAccountInfo).toBeCalledTimes(3)

      resolveLines3(103.0)

      await jest.runAllTimersAsync()
      expect(connectionGetAccountInfo).toBeCalledTimes(4)

      resolveLines4(104.0)

      expect(await balancePromise).toEqual([
        { address: address1, balance: '101' },
        { address: address2, balance: '102' },
        { address: address3, balance: '103' },
        { address: address4, balance: '104' },
      ])
    })
  })

  describe('getTokenBalance', () => {
    const address = 'r123'

    it('should return the token balance', async () => {
      const expectedBalance = 1234.56

      mockAccountInfo(expectedBalance)

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual(expectedBalance)
      expect(connectionGetAccountInfo).toBeCalledWith(createFakePublicKey(address))
      expect(connectionGetAccountInfo).toBeCalledTimes(1)
    })

    it('should throw if SOLANA_RPC_URL is missing', async () => {
      transport = new SolanaBalanceTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          SOLANA_RPC_URL: '',
        },
        endpointName,
        transportName,
      )

      await expect(() => transport.getTokenBalance(address)).rejects.toThrow(
        'Environment variable SOLANA_RPC_URL is missing',
      )
      expect(log).toBeCalledWith('SOLANA_RPC_URL is missing')
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
  })
})
