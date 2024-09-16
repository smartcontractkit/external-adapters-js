import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockAnchorageSuccess, mockBitgoSuccess, mockCBPSuccess } from './fixtures'
import { RecurrenceRule } from 'node-schedule'

jest.mock('node-schedule', () => {
  const actualNodeSchedule = jest.requireActual('node-schedule')
  return {
    ...actualNodeSchedule,
    RecurrenceRule: function () {
      return
    },
    scheduleJob: function (_: RecurrenceRule, callback: () => void) {
      setTimeout(() => {
        callback()
      }, 200)
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ANCHORAGE_ADAPTER_URL =
      process.env.ANCHORAGE_ADAPTER_URL ?? 'https://localhost:8081'
    process.env.BITGO_ADAPTER_URL = process.env.BITGO_ADAPTER_URL ?? 'https://localhost:8082'
    process.env.COINBASE_PRIME_ADAPTER_URL =
      process.env.COINBASE_PRIME_ADAPTER_URL ?? 'https://localhost:8083'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'

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

  describe('address endpoint', () => {
    it('should return success', async () => {
      const data = {
        network: 'bitcoin',
        chainId: 'mainnet',
        anchorage: {
          vaultId: 'b0bb5449c1e4926542ce693b4db2e883',
          coin: 'BTC',
        },
        bitgo: {
          coin: 'tbtc',
          enterpriseId: '1234',
        },
        coinbase_prime: {
          batchSize: 100,
          portfolio: '12345622',
          symbols: ['BTC'],
        },
      }
      mockAnchorageSuccess()
      mockBitgoSuccess()
      mockCBPSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
