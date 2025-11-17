import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/buffer-layout'
import { BufferLayoutTransport } from '../../src/transport/buffer-layout'
import * as usdcMinterAccountData from '../fixtures/usdc-minter-account-data-2025-10-27.json'

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

const usdcMinterAccountAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const getUsdMintercAccountInfoMock = jest.fn()

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    send() {
      if (address === usdcMinterAccountAddress) return getUsdMintercAccountInfoMock()
      throw new Error(`Unexpected account address: ${address}`)
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

describe('BufferLayoutTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'buffer-layout'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const expectedTokenSupply = '10130575983105540'

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

  let transport: BufferLayoutTransport

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new BufferLayoutTransport()

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
    it('should cache token supply response', async () => {
      getUsdMintercAccountInfoMock.mockResolvedValue(usdcMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'buffer-layout',
        stateAccountAddress: usdcMinterAccountAddress,
        field: 'supply',
      })
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: expectedTokenSupply,
        data: {
          result: expectedTokenSupply,
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
    it('should return token supply', async () => {
      getUsdMintercAccountInfoMock.mockResolvedValue(usdcMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'buffer-layout',
        stateAccountAddress: usdcMinterAccountAddress,
        field: 'supply',
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedTokenSupply,
        data: {
          result: expectedTokenSupply,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const tokenData = usdcMinterAccountData.result
      const [tokenDataPromise, resolveTokenData] = deferredPromise<typeof tokenData>()

      getUsdMintercAccountInfoMock.mockResolvedValue(tokenDataPromise)

      const param = makeStub('param', {
        endpoint: 'buffer-layout',
        stateAccountAddress: usdcMinterAccountAddress,
        field: 'supply',
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveTokenData(tokenData)

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedTokenSupply,
        data: {
          result: expectedTokenSupply,
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
