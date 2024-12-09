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
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }
      mockTiingoEAResponseSuccess()
      mockNCFXEAResponseSuccess()
      mockCoinmetricsEAResponseSuccess()
      mockRPCResponses()

      const response = await testAdapter.request(data)
      console.log
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when fewer than required source EAs respond', async () => {
      const data = {
        glv: '0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9',
      }

      mockTiingoEAResponseSuccess()
      mockNCFXEAResponseFailure()
      mockCoinmetricsEAResponseFailure()
      mockRPCResponses()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
