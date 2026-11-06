import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/extension'
import { LEGACY_TOKEN_PROGRAM_ADDRESS } from '../../src/shared/buffer-layout-accounts'
import { ExtensionTransport } from '../../src/transport/extension'
import * as galaxyMinterAccountData from '../fixtures/galaxy-digital-inc-account-data-2025-11-07.json'

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

const galaxyMinterAccountAddress = '2HehXG149TXuVptQhbiWAWDjbbuCsXSAtLTB5wc2aajK'

const getGalaxyMintercAccountInfoMock = jest.fn()

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    send() {
      if (address === galaxyMinterAccountAddress) return getGalaxyMintercAccountInfoMock()
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

describe('ExtensionTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'extension'
  const RPC_URL = 'https://solana.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const expectedTokenSupply = '33475471118'
  const extensionDataOffset = 166

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

  let transport: ExtensionTransport

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new ExtensionTransport()

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
      getGalaxyMintercAccountInfoMock.mockResolvedValue(galaxyMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64' as const,
          },
        ],
        extensionDataOffset,
        extensionFields: [],
        resultName: 'supply',
        resultDecimals: 8,
      })
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: expectedTokenSupply,
        data: {
          supply: expectedTokenSupply,
          decimals: 8,
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
    it('should return base field value', async () => {
      getGalaxyMintercAccountInfoMock.mockResolvedValue(galaxyMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64' as const,
          },
        ],
        extensionDataOffset,
        extensionFields: [],
        resultName: undefined,
        resultDecimals: undefined,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          supply: expectedTokenSupply,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return extension field value', async () => {
      getGalaxyMintercAccountInfoMock.mockResolvedValue(galaxyMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [],
        extensionDataOffset,
        extensionFields: [
          {
            extensionType: 25,
            name: 'currentMultiplier',
            offset: 32,
            type: 'float64' as const,
          },
        ],
        resultName: undefined,
        resultDecimals: undefined,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          currentMultiplier: 1,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should return multiple fields', async () => {
      getGalaxyMintercAccountInfoMock.mockResolvedValue(galaxyMinterAccountData.result)

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64' as const,
          },
        ],
        extensionDataOffset,
        extensionFields: [
          {
            extensionType: 25,
            name: 'currentMultiplier',
            offset: 32,
            type: 'float64' as const,
          },
          {
            extensionType: 25,
            name: 'newMultiplier',
            offset: 48,
            type: 'float64' as const,
          },
          {
            extensionType: 25,
            name: 'activationDateTime',
            offset: 40,
            type: 'int64' as const,
          },
        ],
        resultName: undefined,
        resultDecimals: undefined,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          supply: expectedTokenSupply,
          currentMultiplier: 1,
          newMultiplier: 1,
          activationDateTime: '0',
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should reject extension fields from an account not owned by Token-2022', async () => {
      getGalaxyMintercAccountInfoMock.mockResolvedValue({
        ...galaxyMinterAccountData.result,
        value: {
          ...galaxyMinterAccountData.result.value,
          owner: LEGACY_TOKEN_PROGRAM_ADDRESS,
        },
      })

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [],
        extensionDataOffset,
        extensionFields: [
          {
            extensionType: 25,
            name: 'multiplier',
            offset: 32,
            type: 'float64' as const,
          },
        ],
        resultName: undefined,
        resultDecimals: undefined,
      })

      await expect(transport._handleRequest(param)).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining(
          `Expected account '${galaxyMinterAccountAddress}' to be owned by the Token-2022 program`,
        ),
      })
    })

    it('should reject extension fields from a Token-2022 account that is not a mint', async () => {
      const [encodedData, encoding] = galaxyMinterAccountData.result.value.data
      const data = Buffer.from(encodedData, encoding as BufferEncoding)
      data[extensionDataOffset - 1] = 2 // AccountType.Account

      getGalaxyMintercAccountInfoMock.mockResolvedValue({
        ...galaxyMinterAccountData.result,
        value: {
          ...galaxyMinterAccountData.result.value,
          data: [data.toString(encoding as BufferEncoding), encoding],
        },
      })

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [],
        extensionDataOffset,
        extensionFields: [
          {
            extensionType: 25,
            name: 'multiplier',
            offset: 32,
            type: 'float64' as const,
          },
        ],
        resultName: undefined,
        resultDecimals: undefined,
      })

      await expect(transport._handleRequest(param)).rejects.toMatchObject({
        statusCode: 400,
        message: `Expected account '${galaxyMinterAccountAddress}' to be a Token-2022 mint`,
      })
    })

    it('should reject extension fields from a Token-2022 mint with no extensions', async () => {
      const [encodedData, encoding] = galaxyMinterAccountData.result.value.data
      // A Token-2022 mint with no extensions is only the 82-byte base mint layout
      const data = Buffer.from(encodedData, encoding as BufferEncoding).subarray(0, 82)

      getGalaxyMintercAccountInfoMock.mockResolvedValue({
        ...galaxyMinterAccountData.result,
        value: {
          ...galaxyMinterAccountData.result.value,
          data: [data.toString(encoding as BufferEncoding), encoding],
        },
      })

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [],
        extensionDataOffset,
        extensionFields: [
          {
            extensionType: 25,
            name: 'multiplier',
            offset: 32,
            type: 'float64' as const,
          },
        ],
        resultName: undefined,
        resultDecimals: undefined,
      })

      await expect(transport._handleRequest(param)).rejects.toMatchObject({
        statusCode: 400,
        message: `Account '${galaxyMinterAccountAddress}' has no extensions`,
      })
    })

    it('should allow base fields from an account not owned by Token-2022', async () => {
      getGalaxyMintercAccountInfoMock.mockResolvedValue({
        ...galaxyMinterAccountData.result,
        value: {
          ...galaxyMinterAccountData.result.value,
          owner: LEGACY_TOKEN_PROGRAM_ADDRESS,
        },
      })

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64' as const,
          },
        ],
        extensionDataOffset,
        extensionFields: [],
        resultName: undefined,
        resultDecimals: undefined,
      })

      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          supply: expectedTokenSupply,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const tokenData = galaxyMinterAccountData.result
      const [tokenDataPromise, resolveTokenData] = deferredPromise<typeof tokenData>()

      getGalaxyMintercAccountInfoMock.mockResolvedValue(tokenDataPromise)

      const param = makeStub('param', {
        endpoint: 'extension',
        stateAccountAddress: galaxyMinterAccountAddress,
        baseFields: [
          {
            name: 'supply',
            offset: 36,
            type: 'uint64' as const,
          },
        ],
        extensionDataOffset,
        extensionFields: [],
        resultName: undefined,
        resultDecimals: undefined,
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveTokenData(tokenData)

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: null,
        data: {
          supply: expectedTokenSupply,
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
