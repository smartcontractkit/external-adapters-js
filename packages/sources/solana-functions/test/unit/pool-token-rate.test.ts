import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/pool-token-rate'
import { PoolTokenRateTransport } from '../../src/transport/pool-token-rate'
import * as jitoStakePoolAccountData from '../fixtures/jito-stake-pool-account-data-2026-04-29.json'

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

const jitoStakePoolAccountAddress = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'

const getStakePoolAccountInfoMock = jest.fn()

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (_address: string) => ({
    send() {
      return getStakePoolAccountInfoMock()
    },
  }),
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
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

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('PoolTokenRateTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'pool-token-rate'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const expectedTotalLamports = '10409494211336524'
  const expectedPoolTokenSupply = '8158765909908130'
  const expectedRate = (
    (BigInt(expectedTotalLamports) * 10n ** 18n) /
    BigInt(expectedPoolTokenSupply)
  ).toString()

  const adapterSettings = makeStub('adapterSettings', {
    RPC_URL,
    SOLANA_COMMITMENT: 'finalized',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
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

  let transport: PoolTokenRateTransport

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new PoolTokenRateTransport()

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
    it('should cache token price response', async () => {
      getStakePoolAccountInfoMock.mockResolvedValue(jitoStakePoolAccountData.result)

      const param = makeStub('param', {
        endpoint: 'pool-token-rate',
        stakePoolAccountAddress: jitoStakePoolAccountAddress,
      })
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: expectedRate,
        data: {
          rate: expectedRate,
          decimals: 18,
          totalLamports: expectedTotalLamports,
          poolTokenSupply: expectedPoolTokenSupply,
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
    it('should return token price', async () => {
      getStakePoolAccountInfoMock.mockResolvedValue(jitoStakePoolAccountData.result)

      const param = makeStub('param', {
        endpoint: 'pool-token-rate',
        stakePoolAccountAddress: jitoStakePoolAccountAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedRate,
        data: {
          rate: expectedRate,
          decimals: 18,
          totalLamports: expectedTotalLamports,
          poolTokenSupply: expectedPoolTokenSupply,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const tokenData = jitoStakePoolAccountData.result
      const [poolDataPromise, resolvePoolData] = deferredPromise<typeof tokenData>()

      getStakePoolAccountInfoMock.mockResolvedValue(poolDataPromise)

      const param = makeStub('param', {
        endpoint: 'pool-token-rate',
        stakePoolAccountAddress: jitoStakePoolAccountAddress,
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolvePoolData(tokenData)

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedRate,
        data: {
          rate: expectedRate,
          decimals: 18,
          totalLamports: expectedTotalLamports,
          poolTokenSupply: expectedPoolTokenSupply,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })
  })
})
