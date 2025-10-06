import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBotanixRPCResponses,
  mockCoinmetricsEAResponseFailure,
  mockCoinmetricsEAResponseSuccess,
  mockNCFXEAResponseFailure,
  mockNCFXEAResponseSuccess,
  mockRPCResponses,
  mockTiingoEAResponseSuccess,
  mockTokensInfo,
} from './fixtures'

describe('GM-token price execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.TIINGO_ADAPTER_URL = process.env.TIINGO_ADAPTER_URL ?? 'http://localhost:8081'
    process.env.NCFX_ADAPTER_URL = process.env.NCFX_ADAPTER_URL ?? 'http://localhost:8082'
    process.env.COINMETRICS_ADAPTER_URL =
      process.env.COINMETRICS_ADAPTER_URL ?? 'http://localhost:8083'
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:3040'
    process.env.BOTANIX_RPC_URL = process.env.BOTANIX_RPC_URL ?? 'http://localhost:3050'

    process.env.ARBITRUM_TOKENS_INFO_URL =
      process.env.ARBITRUM_TOKENS_INFO_URL ?? 'http://localhost:5040'
    process.env.BOTANIX_TOKENS_INFO_URL =
      process.env.BOTANIX_TOKENS_INFO_URL ?? 'http://localhost:6040'
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
      mockTokensInfo(process.env.ARBITRUM_TOKENS_INFO_URL!, [
        { symbol: 'LINK', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      ])
      mockTiingoEAResponseSuccess('LINK')
      mockNCFXEAResponseSuccess('LINK')
      mockCoinmetricsEAResponseSuccess('LINK')
      mockRPCResponses()

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

    it('should return error when fewer than required source EAs respond', async () => {
      const data = {
        index: 'ETH',
        long: 'WETH',
        short: 'USDC',
        market: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
      }
      mockTiingoEAResponseSuccess('ETH')
      mockNCFXEAResponseFailure('ETH')
      mockCoinmetricsEAResponseFailure('ETH')
      mockRPCResponses()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('success on Botanix when chain=botanix (uses Botanix resolver decimals)', async () => {
      mockTokensInfo(process.env.BOTANIX_TOKENS_INFO_URL!, [
        { symbol: 'LINK', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18 },
        { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      ])

      // LWBA for all three
      mockTiingoEAResponseSuccess('LINK')
      mockNCFXEAResponseSuccess('LINK')
      mockCoinmetricsEAResponseSuccess('LINK')

      mockBotanixRPCResponses()

      const data = {
        index: 'LINK',
        long: 'LINK',
        short: 'USDC',
        market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
        chain: 'botanix',
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
