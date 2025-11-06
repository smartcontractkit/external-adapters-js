import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockTotalReserveResponseSuccess,
  mockTotalReserveWorldchainResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
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

  describe('totalReserve endpoint', () => {
    it('should return success for Arsx Base Testnet', async () => {
      const data = {
        endpoint: 'totalReserve',
        accountName: 'Arsx Base Testnet',
      }
      mockTotalReserveResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Worldchain Base Testnet', async () => {
      const data = {
        endpoint: 'totalReserve',
        accountName: 'Worldchain Base Testnet',
      }
      mockTotalReserveWorldchainResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail if accountName is not provided', async () => {
      const data = {
        endpoint: 'totalReserve',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail if accountName is not found', async () => {
      const data = {
        endpoint: 'totalReserve',
        accountName: 'Invalid Account',
      }
      mockTotalReserveResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
