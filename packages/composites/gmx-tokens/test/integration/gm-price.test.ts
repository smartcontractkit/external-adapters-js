import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'
import {
  ChainKeyName,
  ChainMetadata,
  applyChainContextMocks,
  metadataUrls,
  mockAllMetadata,
  mockChainRpc,
  mockDataEnginePriceFailure,
  mockDataEnginePriceSuccess,
  resetChainMocks,
} from './gm-fixtures'

describe('GM-token price execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinitionFromConfig<typeof config>>
  let oldEnv: NodeJS.ProcessEnv

  let metadataScopeCleanups: Array<() => void> = []

  const metadataOverrides: Partial<Record<ChainKeyName, Partial<ChainMetadata>>> = {}

  const applyMetadataOverrides = () => {
    metadataScopeCleanups.forEach((cleanup) => cleanup())
    metadataScopeCleanups = mockAllMetadata(metadataOverrides)
  }

  const setChainMetadataOverride = (
    chain: ChainKeyName,
    override: Partial<ChainMetadata> | undefined,
  ) => {
    metadataOverrides[chain] = override
    applyMetadataOverrides()
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.DATA_ENGINE_ADAPTER_URL =
      process.env.DATA_ENGINE_ADAPTER_URL ?? 'http://localhost:8081'
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:3040'
    process.env.BOTANIX_RPC_URL = process.env.BOTANIX_RPC_URL ?? 'http://localhost:3050'
    process.env.AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL ?? 'http://localhost:3060'

    process.env.DATASTORE_CONTRACT_ADDRESS =
      process.env.DATASTORE_CONTRACT_ADDRESS ?? '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8'
    process.env.READER_CONTRACT_ADDRESS =
      process.env.READER_CONTRACT_ADDRESS ?? '0x470fbC46bcC0f16532691Df360A07d8Bf5ee0789'

    process.env.BOTANIX_DATASTORE_CONTRACT_ADDRESS =
      process.env.BOTANIX_DATASTORE_CONTRACT_ADDRESS ?? '0xA23B81a89Ab9D7D89fF8fc1b5d8508fB75Cc094d'
    process.env.BOTANIX_READER_CONTRACT_ADDRESS =
      process.env.BOTANIX_READER_CONTRACT_ADDRESS ?? '0x922766ca6234cD49A483b5ee8D86cA3590D0Fb0E'

    process.env.AVALANCHE_DATASTORE_CONTRACT_ADDRESS =
      process.env.AVALANCHE_DATASTORE_CONTRACT_ADDRESS ??
      '0x2F0b22339414ADeD7D5F06f9D604c7fF5b2fe3f6'
    process.env.AVALANCHE_READER_CONTRACT_ADDRESS =
      process.env.AVALANCHE_READER_CONTRACT_ADDRESS ?? '0x62Cb8740E6986B29dC671B2EB596676f60590A5B'

    process.env.ARBITRUM_TOKENS_INFO_URL =
      process.env.ARBITRUM_TOKENS_INFO_URL ?? 'http://localhost:5040/tokens'
    process.env.BOTANIX_TOKENS_INFO_URL =
      process.env.BOTANIX_TOKENS_INFO_URL ?? 'http://localhost:6040/tokens'
    process.env.AVALANCHE_TOKENS_INFO_URL =
      process.env.AVALANCHE_TOKENS_INFO_URL ?? 'http://localhost:7040/tokens'

    process.env.ARBITRUM_MARKETS_INFO_URL =
      process.env.ARBITRUM_MARKETS_INFO_URL ?? 'http://localhost:5040/markets'
    process.env.BOTANIX_MARKETS_INFO_URL =
      process.env.BOTANIX_MARKETS_INFO_URL ?? 'http://localhost:6040/markets'
    process.env.AVALANCHE_MARKETS_INFO_URL =
      process.env.AVALANCHE_MARKETS_INFO_URL ?? 'http://localhost:7040/markets'
    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    metadataUrls.forEach((envKey) => {
      if (!process.env[envKey]) throw new Error(`${envKey} is not set`)
    })

    applyChainContextMocks()
    applyMetadataOverrides()

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  afterEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
    resetChainMocks()
    applyMetadataOverrides()
  })

  describe('price endpoint', () => {
    const arbPriceMap = {
      '0xfeedlink': { bid: '1999000000000000000', ask: '2001000000000000000', decimals: 18 },
      '0xfeedusdc': { bid: '1000000000000000000', ask: '1000000000000000000', decimals: 18 },
    }

    const botanixPriceMap = {
      '0xfeedlink': { bid: '3000000000000000000', ask: '3200000000000000000', decimals: 18 },
      '0xfeedusdc': { bid: '1000000000000000000', ask: '1000000000000000000', decimals: 18 },
    }

    const avalanchePriceMap = {
      '0xfeedbtc': { bid: '25000000000000000000000', ask: '25100000000000000000000', decimals: 18 },
      '0xfeedusdce': { bid: '100000000', ask: '100000000', decimals: 8 },
    }

    const DOGE_ADDRESS = '0x000000000000000000000000000000000000d06e'

    it('success on Arbitrum (default chain)', async () => {
      mockDataEnginePriceSuccess(arbPriceMap)
      mockChainRpc('arbitrum', {
        feedIds: {
          '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': '0xfeedlink',
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '0xfeedusdc',
        },
        marketPrices: {
          '0x7f1fa204bb700853D36994DA19F830b6Ad18455C': {
            maximized: '0x0000000000000000000000000000000000000000000000001bc16d674ec80000',
            minimized: '0x0000000000000000000000000000000000000000000000001a784379d99db420',
          },
        },
      })

      const data = {
        endpoint: 'gm-price',
        index: 'LINK',
        long: 'LINK',
        short: 'USDC',
        market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('success on Botanix chain', async () => {
      mockDataEnginePriceSuccess(botanixPriceMap)
      mockChainRpc('botanix', {
        feedIds: {
          '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': '0xfeedlink',
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '0xfeedusdc',
        },
        marketPrices: {
          '0x7f1fa204bb700853D36994DA19F830b6Ad18455C': {
            maximized: '0x0000000000000000000000000000000000000000000000001f4b323c3a1f3a00',
            minimized: '0x0000000000000000000000000000000000000000000000001d1a94a200322000',
          },
        },
      })

      const data = {
        index: 'LINK',
        long: 'LINK',
        short: 'USDC',
        market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
        chain: 'botanix' as const,
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('success on Avalanche chain', async () => {
      mockDataEnginePriceSuccess(avalanchePriceMap)
      mockChainRpc('avalanche', {
        feedIds: {
          '0x152b9d0fdc40c096757f570a51e494bd4b943e50': '0xfeedbtc',
          '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664': '0xfeedusdce',
        },
        marketPrices: {
          '0x62Cb8740E6986B29dC671B2EB596676f60590A5B': {
            maximized: '0x0000000000000000000000000000000000000000000000002393e5939a08ce00',
            minimized: '0x0000000000000000000000000000000000000000000000002360ed181195c600',
          },
        },
      })

      const data = {
        index: 'BTC.b',
        long: 'BTC.b',
        short: 'USDC.e',
        market: '0x62Cb8740E6986B29dC671B2EB596676f60590A5B',
        chain: 'avalanche' as const,
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('should return error when data-engine has no responses', async () => {
      setChainMetadataOverride('arbitrum', {
        tokens: [
          { symbol: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
          { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
        ],
        markets: [
          {
            marketToken: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
            indexToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            isListed: true,
          },
        ],
      })
      mockDataEnginePriceFailure()

      mockChainRpc('arbitrum', {
        feedIds: {
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '0xfeedusdc',
          [DOGE_ADDRESS]: '0xfeed0d0e',
        },
        marketPrices: {
          '0x000000000000000000000000000000000000dead': {
            maximized: '0x0000000000000000000000000000000000000000000000001',
            minimized: '0x0000000000000000000000000000000000000000000000001',
          },
        },
      })

      const res = await testAdapter.request({
        index: 'DOGE',
        long: 'DOGE',
        short: 'USDC',
        market: '0x000000000000000000000000000000000000DEAD',
      })
      expect(res.statusCode).toBe(502)
      expect(res.json()).toMatchSnapshot()
    })
  })
})
