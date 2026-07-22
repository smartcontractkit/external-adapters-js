import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor'
import BN from 'bn.js'
import { BaseEndpointTypes } from '../../src/endpoint/midas'
import * as midasProgramIdl from '../../src/idl/midas.json'
import { MidasTransport } from '../../src/transport/midas'
import * as midasFeedStateAccountData from '../fixtures/midas-feed-state-data-2026-07-21.json'
import * as midasManualFeedStateAccountData from '../fixtures/midas-manual-feed-state-data-2026-07-21.json'

const getAccountInfoRequest = makeStub('getAccountInfoRequest', {
  send: jest.fn(),
})

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: () => getAccountInfoRequest,
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
  },
}))

const setDataFields = async ({
  base64Data,
  idl,
  account,
  data,
}: {
  base64Data: string
  idl: Idl
  account: string
  data: Record<string, unknown>
}): Promise<string> => {
  const binaryData = Buffer.from(base64Data, 'base64')
  const coder = new BorshAccountsCoder(idl)
  const decodedData = coder.decode(account, binaryData)
  for (const [field, newValue] of Object.entries(data)) {
    decodedData[field] = newValue
  }
  const newBinaryData = await coder.encode(account, decodedData)
  return newBinaryData.toString('base64')
}

const RESULT_DECIMALS = 18

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

describe('MidasTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'midas'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const midasFeedStateAddress = '7UVwLrMTEDVvzQRaitJi7YLJcxFY8RTmXrHvSPMjTGDm'
  const midasFeedProgramAddress = 'MDF1kkcgJqyizY8k3U1ESAxLBYFYmE3qTwxf2pmGE1s'
  const expectedMidasTokenPrice = '1000000000000000000'
  const expectedResponse = {
    statusCode: 200,
    result: expectedMidasTokenPrice,
    data: {
      result: expectedMidasTokenPrice,
      decimals: RESULT_DECIMALS,
      price: 1,
      rawPrice: expectedMidasTokenPrice,
      minPrice: 0.9965,
      maxPrice: 1.04,
      lastUpdatedAt: 1784568395,
      secondsSinceLastUpdate: 66805,
      maxStaleness: 2592000,
      ripcord: 0,
    },
  }

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
    getCacheKey: jest.fn(),
    get: jest.fn(),
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: MidasTransport

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00Z'))

    transport = new MidasTransport()

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
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })
      await transport.handleRequest(param)

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: {
            ...expectedResponse,
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return response', async () => {
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return a different price', async () => {
      const expectedMidasTokenPrice = '100234500'
      const expectedScaledMidasTokenPrice = `${expectedMidasTokenPrice}0000000000`
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const base64Data = await setDataFields({
        base64Data: midasManualFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'ManualFeedState',
        data: { price: new BN(expectedMidasTokenPrice) },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        result: expectedScaledMidasTokenPrice,
        data: {
          ...expectedResponse.data,
          result: expectedScaledMidasTokenPrice,
          rawPrice: expectedScaledMidasTokenPrice,
          price: Number(expectedScaledMidasTokenPrice) / 10 ** RESULT_DECIMALS,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should work with different decimals', async () => {
      const decimals = 7
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const base64Data = await setDataFields({
        base64Data: midasManualFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'ManualFeedState',
        data: {
          decimals: new BN(decimals),
          price: new BN(10 ** decimals),
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return a different minPrice', async () => {
      const expectedMinPrice = '902345000'
      const expectedMinPriceAsNumber = 0.902345
      const base64Data = await setDataFields({
        base64Data: midasFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'FeedState',
        data: {
          min_price: new BN(expectedMinPrice),
        },
      })
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        data: {
          ...expectedResponse.data,
          minPrice: expectedMinPriceAsNumber,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return a different maxPrice', async () => {
      const expectedMaxPrice = '1002345000'
      const expectedMaxPriceAsNumber = 1.002345

      const base64Data = await setDataFields({
        base64Data: midasFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'FeedState',
        data: {
          max_price: new BN(expectedMaxPrice),
        },
      })
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        data: {
          ...expectedResponse.data,
          maxPrice: expectedMaxPriceAsNumber,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should ripcord when price is stale', async () => {
      jest.setSystemTime(new Date('2026-08-21T12:00:00Z'))
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        data: {
          ...expectedResponse.data,
          secondsSinceLastUpdate: 2745205,
          ripcord: 1,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should ripcord and return last valid price on out-of-bounds price', async () => {
      const lastScaledValidPrice = '1001745000000000000'
      const lastValidUpdatedAt = 1784561111
      const invalidPrice = '999999999'
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const base64Data = await setDataFields({
        base64Data: midasManualFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'ManualFeedState',
        data: {
          price: new BN(invalidPrice),
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const cachedResponse = makeStub('cachedResponse', {
        result: lastScaledValidPrice,
        data: {
          lastUpdatedAt: lastValidUpdatedAt,
        },
      })
      responseCache.get.mockResolvedValueOnce(cachedResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        ...expectedResponse,
        result: lastScaledValidPrice,
        data: {
          ...expectedResponse.data,
          result: lastScaledValidPrice,
          lastUpdatedAt: lastValidUpdatedAt,
          secondsSinceLastUpdate:
            expectedResponse.data.secondsSinceLastUpdate +
            (expectedResponse.data.lastUpdatedAt - lastValidUpdatedAt),
          rawPrice: `${invalidPrice}0000000000`,
          price: Number(lastScaledValidPrice) / 10 ** RESULT_DECIMALS,
          ripcord: 1,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toBeCalledWith(
        `Price 9.99999999 is out of bounds [0.9965, 1.04]. Getting price from cache.`,
      )
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should throw on out-of-bounds price without cached response', async () => {
      const invalidPrice = '999999999'
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const base64Data = await setDataFields({
        base64Data: midasManualFeedStateAccountData.result.value.data[0],
        idl: midasProgramIdl as unknown as Idl,
        account: 'ManualFeedState',
        data: {
          price: new BN(invalidPrice),
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: midasFeedProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      responseCache.get.mockResolvedValueOnce(undefined)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        new AdapterInputError({
          statusCode: 502,
          message: `Price 9.99999999 is out of bounds [0.9965, 1.04] and no cached price is available.`,
        }),
      )

      expect(log).toBeCalledWith(
        `Price 9.99999999 is out of bounds [0.9965, 1.04]. Getting price from cache.`,
      )
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })
      const manualFeedStateDataResponse = makeStub('manualFeedStateDataResponse', {
        value: {
          data: midasManualFeedStateAccountData.result.value.data,
          owner: midasFeedProgramAddress,
        },
      })

      const [feedStateDataPromise, resolveFeedStateData] =
        deferredPromise<typeof feedStateDataResponse>()

      getAccountInfoRequest.send.mockReturnValueOnce(feedStateDataPromise)
      getAccountInfoRequest.send.mockResolvedValueOnce(manualFeedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveFeedStateData(feedStateDataResponse)

      expect(await responsePromise).toEqual({
        ...expectedResponse,
        data: {
          ...expectedResponse.data,
          secondsSinceLastUpdate: expectedResponse.data.secondsSinceLastUpdate + 1,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      log.mockClear()
    })

    it('should throw if account does not have an owner', async () => {
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: undefined,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })

      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        `No program address found for state account '${midasFeedStateAddress}'`,
      )
    })

    it('should throw if account has an unknown owner', async () => {
      const programAddress = 'unknown-program-123'
      const feedStateDataResponse = makeStub('feedStateDataResponse', {
        value: {
          data: midasFeedStateAccountData.result.value.data,
          owner: programAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(feedStateDataResponse)

      const param = makeStub('param', {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      })
      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        `No IDL known for program address '${programAddress}'`,
      )
    })
  })
})
