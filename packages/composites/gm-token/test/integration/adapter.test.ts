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
  mockRPCResponses,
  mockTiingoEAResponseSuccess,
} from './fixtures'

describe('execute', () => {
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
    it('should return success', async () => {
      const data = {
        index: 'LINK',
        long: 'LINK',
        short: 'USDC',
        market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
      }
      mockTiingoEAResponseSuccess('LINK')
      mockNCFXEAResponseSuccess('LINK')
      mockCoinmetricsEAResponseSuccess('LINK')
      mockRPCResponses()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
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
  })
})
