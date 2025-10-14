import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AxiosRequestConfig } from 'axios'
import { BaseEndpointTypes } from '../../src/endpoint/totalBalance'
import {
  GetBalanceResult,
  GetStakeResult,
  TotalBalanceTransport,
} from '../../src/transport/totalBalance'

const RESULT_DECIMALS = 18

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

describe('TotalBalanceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'totalBalance'
  const P_CHAIN_RPC_URL = 'https://p-chain.avalanche.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const GROUP_SIZE = 3
  const assetId = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z'

  const adapterSettings = makeStub('adapterSettings', {
    P_CHAIN_RPC_URL,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    GROUP_SIZE,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: TotalBalanceTransport

  let mockedBalanceResultByAddress: Record<string, Promise<GetBalanceResult>> = {}
  let mockedStakeResultByAddress: Record<string, Promise<GetStakeResult>> = {}

  const mockBalanceRpc = ({
    address,
    unlocked = '0',
    lockedStakeable = '0',
    lockedNotStakeable = '0',
  }: {
    address: string
    unlocked?: string | Promise<string>
    lockedStakeable?: string | Promise<string>
    lockedNotStakeable?: string | Promise<string>
  }) => {
    mockedBalanceResultByAddress[address] = (async () => {
      const balance = (
        Number(await unlocked) +
        Number(await lockedStakeable) +
        Number(await lockedNotStakeable)
      ).toString()
      return {
        balance,
        unlocked: await unlocked,
        lockedStakeable: await lockedStakeable,
        lockedNotStakeable: await lockedNotStakeable,
        balances: {
          [assetId]: balance,
        },
        unlockeds: {
          [assetId]: await unlocked,
        },
        lockedStakeables: {
          [assetId]: await lockedStakeable,
        },
        lockedNotStakeables: {
          [assetId]: await lockedNotStakeable,
        },
      } as unknown as GetBalanceResult
    })()
  }

  const mockStakeRpc = ({
    address,
    staked = '0',
  }: {
    address: string
    staked?: string | Promise<string>
  }) => {
    mockedStakeResultByAddress[address] = (async () => {
      return {
        staked: (await staked).toString(),
        stakeds: {
          [assetId]: (await staked).toString(),
        },
      } as unknown as GetStakeResult
    })()
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    mockedBalanceResultByAddress = {}
    mockedStakeResultByAddress = {}

    requester.request.mockImplementation(
      async (_cacheKey: string, requestConfig: AxiosRequestConfig) => {
        const method = requestConfig.data.method
        let result: Promise<GetBalanceResult | GetStakeResult>
        const address = requestConfig.data.params.addresses[0]
        if (method === 'platform.getBalance') {
          result = mockedBalanceResultByAddress[address]
          if (!result) {
            throw new Error(`No mocked balance for address ${address}`)
          }
        } else if (method === 'platform.getStake') {
          result = mockedStakeResultByAddress[address]
          if (!result) {
            throw new Error(`No mocked stake for address ${address}`)
          }
        } else {
          throw new Error(`Unexpected method '${method}'`)
        }
        return {
          response: {
            data: {
              result: await result,
            },
          },
        }
      },
    )

    transport = new TotalBalanceTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
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
      const address = 'P-avax101'
      const unlocked = '123'
      const staked = '456'

      mockBalanceRpc({ address, unlocked })
      mockStakeRpc({ address, staked })

      const param = makeStub('param', {
        addresses: [{ address }],
        assetId,
      })
      await transport.handleRequest(param)

      const expectedResult = [
        {
          address,
          balance: (579_000_000_000).toString(),
          staked: (456_000_000_000).toString(),
          unlocked: (123_000_000_000).toString(),
          lockedStakeable: '0',
          lockedNotStakeable: '0',
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
    it('should return balances for multiple addresses', async () => {
      const address1 = 'P-avax101'
      const address2 = 'P-avax102'
      const unlocked1 = '100'
      const unlocked2 = '200'

      mockBalanceRpc({ address: address1, unlocked: unlocked1 })
      mockBalanceRpc({ address: address2, unlocked: unlocked2 })
      mockStakeRpc({ address: address1 })
      mockStakeRpc({ address: address2 })

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
        assetId,
      })
      const response = await transport._handleRequest(param)

      const expectedResult = [
        {
          address: address1,
          balance: '100000000000',
          staked: '0',
          unlocked: '100000000000',
          lockedStakeable: '0',
          lockedNotStakeable: '0',
        },
        {
          address: address2,
          balance: '200000000000',
          staked: '0',
          unlocked: '200000000000',
          lockedStakeable: '0',
          lockedNotStakeable: '0',
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

    it('should add up different types of balance', async () => {
      const address = 'P-avax101'
      const unlocked = '101'
      const lockedStakeable = '201'
      const lockedNotStakeable = '301'
      const staked = '401'

      mockBalanceRpc({ address, unlocked, lockedStakeable, lockedNotStakeable })
      mockStakeRpc({ address, staked })

      const param = makeStub('param', {
        addresses: [{ address }],
        assetId,
      })
      const response = await transport._handleRequest(param)

      const expectedResult = [
        {
          address,
          balance: '1004000000000',
          staked: '401000000000',
          unlocked: '101000000000',
          lockedStakeable: '201000000000',
          lockedNotStakeable: '301000000000',
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
      const address = 'P-avax101'
      const unlocked = '1'

      const [unlockedPromise, resolveUnlocked] = deferredPromise<string>()
      mockBalanceRpc({ address, unlocked: unlockedPromise })
      mockStakeRpc({ address })

      const param = makeStub('param', {
        addresses: [{ address }],
        assetId,
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveUnlocked(unlocked)

      const expectedResult = [
        {
          address,
          balance: '1000000000',
          staked: '0',
          unlocked: '1000000000',
          lockedStakeable: '0',
          lockedNotStakeable: '0',
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
    })
  })
})
