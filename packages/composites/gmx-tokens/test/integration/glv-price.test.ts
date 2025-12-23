import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'
import {
  DEFAULT_GLV_ADDRESS,
  DEFAULT_MARKETS,
  DEFAULT_TOKENS,
  applyChainContextMocks,
  mockDataEngineEAResponseFailure,
  mockDataEngineEAResponseSuccess,
  mockMarketInfoApiSuccess,
  mockTokenInfoApiSuccess,
  resetChainContextMocks,
} from './glv-fixtures'

const applyDefaultMetadataMocks = () => {
  mockTokenInfoApiSuccess(DEFAULT_TOKENS, 'ARBITRUM_TOKENS_INFO_URL')
  mockMarketInfoApiSuccess(DEFAULT_MARKETS, 'ARBITRUM_MARKETS_INFO_URL')
}

describe('GLV price execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinitionFromConfig<typeof config>>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.DATA_ENGINE_ADAPTER_URL =
      process.env.DATA_ENGINE_ADAPTER_URL ?? 'http://localhost:9081'
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:9040'
    process.env.BOTANIX_RPC_URL = process.env.BOTANIX_RPC_URL ?? 'http://localhost:9050'
    process.env.AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL ?? 'http://localhost:9060'

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

    process.env.GLV_READER_CONTRACT_ADDRESS =
      process.env.GLV_READER_CONTRACT_ADDRESS ?? '0x2C670A23f1E798184647288072e84054938B5497'
    process.env.BOTANIX_GLV_READER_CONTRACT_ADDRESS =
      process.env.BOTANIX_GLV_READER_CONTRACT_ADDRESS ??
      '0x955Aa50d2ecCeffa59084BE5e875eb676FfAFa98'
    process.env.AVALANCHE_GLV_READER_CONTRACT_ADDRESS =
      process.env.AVALANCHE_GLV_READER_CONTRACT_ADDRESS ??
      '0x5C6905A3002f989E1625910ba1793d40a031f947'

    process.env.ARBITRUM_TOKENS_INFO_URL =
      process.env.ARBITRUM_TOKENS_INFO_URL ?? 'http://localhost:9044/tokens'
    process.env.ARBITRUM_MARKETS_INFO_URL =
      process.env.ARBITRUM_MARKETS_INFO_URL ?? 'http://localhost:9044/markets'

    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    applyChainContextMocks()
    applyDefaultMetadataMocks()

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
    resetChainContextMocks()
  })

  afterEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
    applyDefaultMetadataMocks()
  })

  describe('glv-price endpoint', () => {
    it('returns success with combined price and LWBA data', async () => {
      mockDataEngineEAResponseSuccess()

      const res = await testAdapter.request({
        endpoint: 'glv-price',
        glv: DEFAULT_GLV_ADDRESS,
      })

      expect(res.statusCode).toBe(200)
      const payload = res.json()
      expect(payload.data).toBeDefined()
      expect(typeof payload.data.result).toBe('number')
      expect(typeof payload.data.mid).toBe('number')
      expect(typeof payload.data.bid).toBe('number')
      expect(typeof payload.data.ask).toBe('number')
      expect(Number.isFinite(payload.data.result)).toBe(true)
      expect(payload.data.result).toBe(payload.data.mid)
      expect(payload.data.bid).toBeLessThanOrEqual(payload.data.mid)
      expect(payload.data.ask).toBeGreaterThanOrEqual(payload.data.mid)
      expect(payload.result).toBe(payload.data.result)
      expect(res.json()).toMatchSnapshot()
    })

    it('supports crypto-lwba alias', async () => {
      mockDataEngineEAResponseSuccess()

      const res = await testAdapter.request({
        endpoint: 'crypto-lwba',
        glv: DEFAULT_GLV_ADDRESS,
      })

      expect(res.statusCode).toBe(200)
      const payload = res.json()
      expect(payload.data.result).toBeDefined()
      expect(payload.data.mid).toBeDefined()
      expect(payload.data.bid).toBeDefined()
      expect(payload.data.ask).toBeDefined()
    })

    it('bubbles up data-engine failures', async () => {
      mockDataEngineEAResponseFailure()

      const res = await testAdapter.request({
        endpoint: 'glv-price',
        glv: DEFAULT_GLV_ADDRESS,
      })

      expect(res.statusCode).toBe(502)
      expect(res.json().errorMessage).toMatch(/Missing responses/i)
    })
  })
})
