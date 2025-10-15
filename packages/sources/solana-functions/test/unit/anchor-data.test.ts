import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor'
import BN from 'bn.js'
import { BaseEndpointTypes } from '../../src/endpoint/anchor-data'
import * as adrenaProgramIdl from '../../src/idl/adrena.json'
import * as flashTradeProgramIdl from '../../src/idl/flash_trade.json'
import { AnchorDataTransport } from '../../src/transport/anchor-data'
import * as adrenaAccountData from '../fixtures/adrena-account-data-2025-10-08.json'
import * as flashTradeAccountData from '../fixtures/flash-trade-account-data-2025-10-08.json'
import * as fragmetricAccountData from '../fixtures/fragmetric-account-data-2025-10-06.json'

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

const setDataField = async ({
  base64Data,
  idl,
  account,
  field,
  newValue,
}: {
  base64Data: string
  idl: Idl
  account: string
  field: string
  newValue: unknown
}): Promise<string> => {
  const binaryData = Buffer.from(base64Data, 'base64')
  const coder = new BorshAccountsCoder(idl)
  const decodedData = coder.decode(account, binaryData)
  decodedData[field] = newValue
  const newBinaryData = await coder.encode(account, decodedData)
  return newBinaryData.toString('base64')
}

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

describe('AnchorDataTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'anchor-data'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const fragmetricAccountAddress = '3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb'
  const fragmetricLiquidStakingProgramAddress = 'fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3'
  const adrenaAccountAddress = '4bQRutgDJs6vuh6ZcWaPVXiQaBzbHketjbCDjL4oRN34'
  const flashTradeAccountAddress = 'HfF7GCcEc76xubFCHLLXRdYcgRzwjEPdfKWqzRS8Ncog'
  const expectedFragmetricTokenPrice = '1079420719'

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

  let transport: AnchorDataTransport

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new AnchorDataTransport()

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
    it('should cache fragmetric response', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'one_receipt_token_as_sol',
      })
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: expectedFragmetricTokenPrice,
        data: {
          result: expectedFragmetricTokenPrice,
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
    it('should return fragmetric token price', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'one_receipt_token_as_sol',
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedFragmetricTokenPrice,
        data: {
          result: expectedFragmetricTokenPrice,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return token supply', async () => {
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'receipt_token_supply_amount',
      })

      const response = await transport._handleRequest(param)

      const expectedTokenSupply = '316994539554695'

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
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: fragmetricLiquidStakingProgramAddress,
        },
      })

      const [accountDataPromise, resolveAccountData] = deferredPromise<typeof accountDataResponse>()

      getAccountInfoRequest.send.mockReturnValue(accountDataPromise)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'one_receipt_token_as_sol',
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveAccountData(accountDataResponse)

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedFragmetricTokenPrice,
        data: {
          result: expectedFragmetricTokenPrice,
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
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: undefined,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'receipt_token_supply_amount',
      })

      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        `No program address found for state account '${fragmetricAccountAddress}'`,
      )
    })

    it('should throw if account has an unknown owner', async () => {
      const programAddress = 'unknown-program-123'
      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: fragmetricAccountData.result.value.data,
          owner: programAddress,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricAccountAddress,
        account: 'FundAccount',
        field: 'receipt_token_supply_amount',
      })

      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        `No IDL known for program address '${programAddress}'`,
      )
    })

    it('should return adrena token price', async () => {
      const expectedTokenPrice = '98765432123'
      const priceField = 'lp_token_price_usd'
      const base64Data = await setDataField({
        base64Data: adrenaAccountData.result.value.data[0] as string,
        idl: adrenaProgramIdl as unknown as Idl,
        account: 'Pool',
        field: priceField,
        newValue: new BN(expectedTokenPrice),
      })

      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: adrenaAccountData.result.value.owner,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: adrenaAccountAddress,
        account: 'Pool',
        field: priceField,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedTokenPrice,
        data: {
          result: expectedTokenPrice,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return flash trade token price', async () => {
      const expectedTokenPrice = '12345654321'
      const priceField = 'compounding_lp_price'
      const base64Data = await setDataField({
        base64Data: flashTradeAccountData.result.value.data[0] as string,
        idl: flashTradeProgramIdl as unknown as Idl,
        account: 'Pool',
        field: priceField,
        newValue: new BN(expectedTokenPrice),
      })

      const accountDataResponse = makeStub('accountDataResponse', {
        value: {
          data: [base64Data, 'base64'],
          owner: flashTradeAccountData.result.value.owner,
        },
      })

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: flashTradeAccountAddress,
        account: 'Pool',
        field: priceField,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: expectedTokenPrice,
        data: {
          result: expectedTokenPrice,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should throw if account does not have the given field', async () => {
      const accountDataResponse = makeStub('accountDataResponse', adrenaAccountData.result)

      getAccountInfoRequest.send.mockResolvedValueOnce(accountDataResponse)

      const param = makeStub('param', {
        endpoint: 'anchor-data',
        stateAccountAddress: adrenaAccountAddress,
        account: 'Pool',
        field: 'unknown_field_123',
      })

      await expect(() => transport._handleRequest(param)).rejects.toThrow(
        `No field 'unknown_field_123' in IDL for program with address '13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet'. Available fields are: bump, lp_token_bump, nb_stable_custody, initialized, allow_trade, allow_swap, liquidity_state, registered_custody_count, name, custodies, fees_debt_usd, referrers_fee_debt_usd, cumulative_referrer_fee_usd, lp_token_price_usd, whitelisted_swapper, ratios, last_aum_and_lp_token_price_usd_update, unique_limit_order_id_counter, aum_usd, inception_time, aum_soft_cap_usd`,
      )
    })
  })
})
