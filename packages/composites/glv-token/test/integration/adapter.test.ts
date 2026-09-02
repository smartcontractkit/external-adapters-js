// tests/execute.test.ts
import {
  LwbaResponseDataFields,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  MARKET,
  mockDataEngineEAResponseFailure,
  mockDataEngineEAResponseSuccess,
  mockMarketInfoApi,
  mockMarketInfoApiSuccess,
  mockTokenInfoApiSuccess,
  NEW_MARKET,
  UNKNOWN_MARKET,
} from './fixtures'

jest.mock('../../src/transport/gmx-keys', () => ({
  dataStreamIdKey: (addr: string) => `0xfeed${addr.slice(2, 10).padEnd(64, '0')}`,
}))

// The markets the on-chain GLV info reports, mutable so tests can simulate GMX adding
// a market that the cached /markets metadata does not know about yet.
let mockOnChainMarkets = [MARKET]

jest.mock('ethers', () => {
  const real = jest.requireActual('ethers')

  // v6-compatible minimal stubs
  function JsonRpcProvider(..._args: any[]) {
    // no-op stub; only passed around
    return {} as any
  }

  function Contract(..._args: any[]) {
    return {
      getGlvInfo: () => ({
        glv: {
          glvToken: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
          longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
          shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        },
        markets: mockOnChainMarkets,
      }),

      // BaseGlvTransport.getFeedId() calls this on the datastore contract
      getBytes32: (_key: string) =>
        '0x0003000000000000000000000000000000000000000000000000000000000000',

      // Your code destructures like: const [[max],[min]] = Promise.all([...])
      // So return an array; element[0] must be BigNumberish. In v6, hex string is fine.
      getGlvTokenPrice: (
        _dataStore: string,
        _markets: string[],
        _indexTokenPrices: unknown[],
        _longTokenPrice: unknown[],
        _shortTokenPrice: unknown[],
        _glv: string,
        maximize: boolean,
      ) => {
        if (maximize) {
          // ≈ 1.1473068612168396 @ 30 decimals (hex BigNumberish)
          return ['0x0e7b25fe03f0eda42ead663c4f']
        }
        // ≈ 1.1470467994160611 @ 30 decimals
        return ['0x0e7a4edfc978cf077056d4bea6']
      },
    }
  }

  return {
    ...real,
    ethers: {
      ...real.ethers,
      JsonRpcProvider,
      Contract,
      formatUnits: real.formatUnits, // keep v6 formatter
    },
    // also mirror top-level exports for v6 import styles if used directly
    JsonRpcProvider,
    Contract,
    formatUnits: real.formatUnits,
  }
})
const GLV = '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9'
const MOCK_NOW = new Date('2001-01-01T11:11:11.111Z').getTime()

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:3040'
    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.METADATA_REFRESH_INTERVAL_MS = '0'
    process.env.DATA_ENGINE_ADAPTER_URL =
      process.env.DATA_ENGINE_ADAPTER_URL ?? 'http://localhost:8089'
    process.env.TOKEN_INFO_API = process.env.TOKEN_INFO_API ?? 'http://localhost:8091'
    process.env.MARKET_INFO_API = process.env.MARKET_INFO_API ?? 'http://localhost:8092'
    process.env.GLV_READER_CONTRACT_ADDRESS = '0x1111111111111111111111111111111111111111'
    process.env.DATASTORE_CONTRACT_ADDRESS = '0x2222222222222222222222222222222222222222'

    spy = jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
    mockTokenInfoApiSuccess()
    mockMarketInfoApiSuccess()
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

  beforeEach(() => {
    mockTokenInfoApiSuccess()
    mockMarketInfoApiSuccess()
  })

  afterEach(() => {
    nock.cleanAll()
    testAdapter.mockCache?.cache.clear()
  })

  describe('price endpoint', () => {
    it('returns success with data-engine + metadata', async () => {
      mockDataEngineEAResponseSuccess()

      const data = {
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)

      const json = response.json()
      expect(json.data).toBeDefined()
      expect(typeof json.data.result).toBe('number')
      expect(Number.isFinite(json.data.result)).toBe(true)

      expect(json.data.sources).toBeDefined()
      expect(Object.keys(json.data.sources).length).toBeGreaterThan(0)
      expect(response.json()).toMatchSnapshot()
    })

    it('fails when data-engine fails for all assets', async () => {
      mockDataEngineEAResponseFailure()

      const data = {
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(502)
      const json = response.json()
      expect(json.errorMessage).toMatch(/Missing responses from data-engine/i)
    })
  })

  describe('lwba endpoint', () => {
    it('returns success and valid LWBA triplet', async () => {
      mockDataEngineEAResponseSuccess()

      const data = {
        endpoint: 'crypto-lwba',
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)

      const json = response.json()
      const resData = json.data as LwbaResponseDataFields['Data']
      expect(typeof resData.bid).toBe('number')
      expect(typeof resData.mid).toBe('number')
      expect(typeof resData.ask).toBe('number')
      validateLwbaResponse(resData.bid, resData.mid, resData.ask)
      const sources = (json.data as any).sources
      expect(sources).toBeDefined()
      expect(Object.keys(sources).length).toBeGreaterThan(0)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stale metadata', () => {
    // Each test moves the clock past the refresh cooldown left behind by the previous one
    const advanceClock = (minutes: number) => spy.mockReturnValue(MOCK_NOW + minutes * 60 * 1000)

    afterEach(() => {
      mockOnChainMarkets = [MARKET]
    })

    it('re-requests /markets and recovers when the chain reports an unknown market', async () => {
      nock.cleanAll()
      mockTokenInfoApiSuccess()
      let marketFetches = 0
      mockMarketInfoApi([MARKET, NEW_MARKET], () => marketFetches++)
      mockDataEngineEAResponseSuccess()
      mockOnChainMarkets = [MARKET, NEW_MARKET]
      advanceClock(10)

      const response = await testAdapter.request({ glv: GLV })

      expect(marketFetches).toBeGreaterThan(0)
      expect(response.statusCode).toBe(200)
    })

    it('fails with the missing address when the refresh does not resolve it', async () => {
      nock.cleanAll()
      mockTokenInfoApiSuccess()
      mockMarketInfoApiSuccess() // /markets stays behind and never lists UNKNOWN_MARKET
      mockDataEngineEAResponseSuccess()
      mockOnChainMarkets = [MARKET, UNKNOWN_MARKET]
      advanceClock(20)

      const response = await testAdapter.request({ glv: GLV })

      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain(UNKNOWN_MARKET)
    })

    it('only re-requests /markets once while the cooldown is active', async () => {
      nock.cleanAll()
      mockTokenInfoApiSuccess()
      let marketFetches = 0
      mockMarketInfoApi([MARKET], () => marketFetches++)
      mockDataEngineEAResponseSuccess()
      mockOnChainMarkets = [MARKET, UNKNOWN_MARKET]
      advanceClock(30)

      await testAdapter.request({ glv: GLV })
      testAdapter.mockCache?.cache.clear()
      await testAdapter.request({ glv: GLV })

      // The clock does not move, so only the first miss is allowed to refresh
      expect(marketFetches).toBe(1)
    })
  })
})
