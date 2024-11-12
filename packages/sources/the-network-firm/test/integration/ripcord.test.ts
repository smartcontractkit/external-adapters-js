import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBackedResponseFailure,
  mockEurrResponseFailure,
  mockGiftResponseFailure,
  mockSTBTResponseFailure,
  mockUSDRResponseFailure,
} from './fixtures'

// The reason why the failure case of 'stbt' endpoint is in a separate file is because of race conditions causing tests to fail
// as both success and failure cases use the same input params and connect to the same endpoint.
describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
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

  describe('stbt endpoint when ripcord true ', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'stbt',
      }
      mockSTBTResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('backed endpoint when ripcord true', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'backed',
        accountName: 'IBTA',
      }
      mockBackedResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('usdr endpoint when ripcord true ', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'usdr',
      }
      mockUSDRResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('eurr endpoint when ripcord true ', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'eurr',
      }
      mockEurrResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('gift endpoint when ripcord true ', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'gift',
      }
      mockGiftResponseFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
