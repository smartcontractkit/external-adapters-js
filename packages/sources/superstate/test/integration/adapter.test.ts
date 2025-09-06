import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { superstateApiKeyRequest } from '@superstateinc/api-key-request'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

jest.mock('node-schedule', () => ({
  ...jest.requireActual('node-schedule'),
  RecurrenceRule: function () {
    return
  },
  scheduleJob: function () {
    return
  },
}))

jest.mock('date-fns-tz', () => ({
  ...jest.requireActual('date-fns-tz'),
  toZonedTime: jest.fn(() => new Date('2001-01-01T11:11:11.111Z')),
}))

jest.mock('@superstateinc/api-key-request', () => ({
  superstateApiKeyRequest: jest.fn(),
  TransactionStatus: {
    Pending: 'Pending',
  },
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<any>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.TRANSACTION_API_KEY = 'fake-key'
    process.env.TRANSACTION_API_SECRET = 'fake-secret'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'

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
    it('should return success - nav', async () => {
      const data = {
        endpoint: 'reserves',
        fundId: 1,
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return success - aum', async () => {
      const data = {
        endpoint: 'reserves',
        fundId: 1,
        reportValue: 'assets_under_management',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('transactions endpoint', () => {
    it('should return success', async () => {
      const mockedSuperstateApiKeyRequest = jest.mocked(superstateApiKeyRequest)
      mockedSuperstateApiKeyRequest.mockResolvedValue([
        {
          ticker: 'T',
          operation_type: 'REDEEM',
          status: 'DONE',
          dollar_amount: '-100.0',
          created_at: '1',
        },
        {
          ticker: 'T',
          operation_type: 'REDEEM',
          status: 'DONE',
          share_amount: '-1.0',
          created_at: '2',
        },
        {
          ticker: 'T',
          operation_type: 'REDEEM',
          status: 'DONE',
          share_amount: '-1.0',
          notional_value: '-50.0',
          created_at: '3',
        },
      ])
      const data = {
        endpoint: 'transactions',
        fundId: 1,
        ticker: 't',
        transactionStatus: 'Pending',
        operations: ['redeem'],
        decimals: 6,
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
