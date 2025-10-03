import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockCoinmetricsEAResponseFailure,
  mockCoinmetricsEAResponseSuccess,
  mockNCFXEAResponseFailure,
  mockNCFXEAResponseSuccess,
  mockTiingoEAResponseSuccess,
} from './fixtures'

/** --- /tokens resolver mocks --- */
const mockTokensInfo = (
  url: string,
  tokens: Array<{ symbol: string; address: string; decimals: number }>,
) => {
  const { origin, pathname } = new URL(url)
  nock(origin).get(pathname).reply(200, { tokens }).persist()
}

/** ---- ethers: provider + Reader contract mocked ----
 * We only need getMarketTokenPrice; return different values for maximize true/false.
 */
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  ethers: {
    providers: {
      JsonRpcProvider: function () {
        return {} as any
      },
    },
    Contract: function () {
      return {
        getMarketTokenPrice: (
          _datastore: string,
          _marketAndTokens: string[],
          _indexPair: [string, string],
          _longPair: [string, string],
          _shortPair: [string, string],
          _pnlKey: string,
          maximize: boolean,
        ) => {
          // return [ BigNumberLike ] – first element is consumed by the EA
          // Use two close values; result is the median of [min, max].
          return [
            {
              // ~1.1473068612168396 (30-dec fixed); value doesn't matter for snapshot stability
              _hex: maximize ? '0x0e7b25fe03f0eda42ead663c4f' : '0x0e7a4edfc978cf077056d4bea6', // ~1.1470467994160611
              _isBigNumber: true,
            },
          ]
        },
      }
    },
  },
}))

describe('GM-token price execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    // Source EAs
    process.env.TIINGO_ADAPTER_URL = process.env.TIINGO_ADAPTER_URL ?? 'http://localhost:8081'
    process.env.NCFX_ADAPTER_URL = process.env.NCFX_ADAPTER_URL ?? 'http://localhost:8082'
    process.env.COINMETRICS_ADAPTER_URL =
      process.env.COINMETRICS_ADAPTER_URL ?? 'http://localhost:8083'

    // Reader / RPC env (not used because ethers is mocked, but required by init)
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:3040'
    process.env.ARBITRUM_CHAIN_ID = process.env.ARBITRUM_CHAIN_ID ?? '42161'
    process.env.READER_CONTRACT_ADDRESS =
      process.env.READER_CONTRACT_ADDRESS ?? '0xArbReader00000000000000000000000000000001'
    process.env.DATASTORE_CONTRACT_ADDRESS =
      process.env.DATASTORE_CONTRACT_ADDRESS ?? '0xArbDS00000000000000000000000000000000001'

    process.env.BOTANIX_RPC_URL = process.env.BOTANIX_RPC_URL ?? 'http://localhost:3050'
    process.env.BOTANIX_CHAIN_ID = process.env.BOTANIX_CHAIN_ID ?? '3636'
    process.env.BOTANIX_READER_CONTRACT_ADDRESS =
      process.env.BOTANIX_READER_CONTRACT_ADDRESS ?? '0xBotReader0000000000000000000000000000001'
    process.env.BOTANIX_DATASTORE_CONTRACT_ADDRESS =
      process.env.BOTANIX_DATASTORE_CONTRACT_ADDRESS ?? '0xBotDS0000000000000000000000000000000001'

    // Token resolver URLs (+ disable cache to keep tests deterministic)
    process.env.ARBITRUM_TOKENS_INFO_URL =
      process.env.ARBITRUM_TOKENS_INFO_URL ?? 'http://localhost:8090/arbitrum/tokens'
    process.env.BOTANIX_TOKENS_INFO_URL =
      process.env.BOTANIX_TOKENS_INFO_URL ?? 'http://localhost:8090/botanix/tokens'
    process.env.GMX_TOKENS_CACHE_MS = '0'

    process.env.RETRY = process.env.RETRY ?? '0'
    process.env.BACKGROUND_EXECUTE_MS = '0'

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

  describe('price endpoint', () => {
    it('success on Arbitrum (default chain) using resolver decimals', async () => {
      // /tokens → provide decimals + addresses
      mockTokensInfo(process.env.ARBITRUM_TOKENS_INFO_URL!, [
        { symbol: 'LINK', address: '0xLinkArb', decimals: 18 },
        { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
        { symbol: 'ETH', address: '0xEthArb', decimals: 18 },
      ])

      // All EAs return for both assets used
      mockTiingoEAResponseSuccess('LINK')
      mockNCFXEAResponseSuccess('LINK')
      mockCoinmetricsEAResponseSuccess('LINK')

      mockTiingoEAResponseSuccess('USDC')
      mockNCFXEAResponseSuccess('USDC')
      mockCoinmetricsEAResponseSuccess('USDC')

      const data = {
        index: 'LINK',
        long: 'LINK',
        short: 'USDC',
        market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('errors when fewer than required source EAs respond', async () => {
      mockTokensInfo(process.env.ARBITRUM_TOKENS_INFO_URL!, [
        { symbol: 'ETH', address: '0xEthArb', decimals: 18 },
        { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
      ])

      // ETH: only Tiingo succeeds; others fail
      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseFailure('ETH')
      mockCoinmetricsEAResponseFailure('ETH')

      // USDC: mirror failure pattern (not strictly necessary but keeps fixtures consistent)
      mockTiingoEAResponseSuccess('USDC')
      mockNCFXEAResponseFailure('USDC')
      mockCoinmetricsEAResponseFailure('USDC')

      const data = {
        index: 'ETH',
        long: 'WETH', // unwrap → ETH
        short: 'USDC',
        market: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(502)
      expect(res.json()).toMatchSnapshot()
    })

    it('success on Botanix when chain=botanix (uses Botanix resolver decimals)', async () => {
      mockTokensInfo(process.env.BOTANIX_TOKENS_INFO_URL!, [
        { symbol: 'BTC', address: '0xBtcBot', decimals: 8 },
        { symbol: 'ETH', address: '0xEthBot', decimals: 18 },
        { symbol: 'USDC', address: '0xUsdcBot', decimals: 6 },
      ])

      // LWBA for all three
      mockTiingoEAResponseSuccess('BTC')
      mockNCFXEAResponseSuccess('BTC')
      mockCoinmetricsEAResponseSuccess('BTC')

      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseSuccess('ETH')
      mockCoinmetricsEAResponseSuccess('ETH')

      mockTiingoEAResponseSuccess('USDC')
      mockNCFXEAResponseSuccess('USDC')
      mockCoinmetricsEAResponseSuccess('USDC')

      const data = {
        index: 'BTC',
        long: 'ETH',
        short: 'USDC',
        market: '0x000000000000000000000000000000000000B07A',
        chain: 'botanix' as const,
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('unwraps symbols (WBTC.b→BTC, WETH→ETH) end-to-end', async () => {
      mockTokensInfo(process.env.ARBITRUM_TOKENS_INFO_URL!, [
        { symbol: 'BTC', address: '0xBtcArb', decimals: 8 },
        { symbol: 'ETH', address: '0xEthArb', decimals: 18 },
        { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
      ])

      mockTiingoEAResponseSuccess('BTC')
      mockNCFXEAResponseSuccess('BTC')
      mockCoinmetricsEAResponseSuccess('BTC')

      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseSuccess('ETH')
      mockCoinmetricsEAResponseSuccess('ETH')

      mockTiingoEAResponseSuccess('USDC')
      mockNCFXEAResponseSuccess('USDC')
      mockCoinmetricsEAResponseSuccess('USDC')

      const data = {
        index: 'WBTC.b',
        long: 'WETH',
        short: 'USDC',
        market: '0x000000000000000000000000000000000000AL1A',
      }
      const res = await testAdapter.request(data)
      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchSnapshot()
    })

    it('fails when token metadata is missing (resolver → 502)', async () => {
      // Intentionally omit DOGE
      mockTokensInfo(process.env.ARBITRUM_TOKENS_INFO_URL!, [
        { symbol: 'ETH', address: '0xEthArb', decimals: 18 },
        { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
      ])

      mockTiingoEAResponseSuccess('DOGE')
      mockNCFXEAResponseSuccess('DOGE')
      mockCoinmetricsEAResponseSuccess('DOGE')
      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseSuccess('ETH')
      mockCoinmetricsEAResponseSuccess('ETH')
      mockTiingoEAResponseSuccess('USDC')
      mockNCFXEAResponseSuccess('USDC')
      mockCoinmetricsEAResponseSuccess('USDC')

      const res = await testAdapter.request({
        index: 'DOGE',
        long: 'ETH',
        short: 'USDC',
        market: '0x000000000000000000000000000000000000DEAD',
      })
      expect(res.statusCode).toBe(502)
      expect(res.json()).toMatchSnapshot()
    })
  })
})
