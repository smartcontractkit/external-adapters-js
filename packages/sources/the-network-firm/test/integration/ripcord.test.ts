import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBackedResponseFailure,
  mockEmgemxResponseRipcordFailure,
  mockEurrResponseFailure,
  mockGiftResponseFailure,
  mockSTBTResponseFailure,
  mockUraniumResponseRipcordSuccess,
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

    process.env.ALT_API_ENDPOINT = 'http://test-endpoint-new'
    process.env.EMGEMX_API_KEY = 'api-key'
    process.env.URANIUM_API_KEY = 'api-key'

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

  describe('stbt endpoint when ripcord true', () => {
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

  describe('usdr endpoint when ripcord true', () => {
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

  describe('eurr endpoint when ripcord true', () => {
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

  describe('gift endpoint when ripcord true', () => {
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

  describe('emgemx endpoint when ripcord true', () => {
    it('should return error', async () => {
      const data = {
        endpoint: 'emgemx',
      }
      mockEmgemxResponseRipcordFailure()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('uranium endpoint when ripcord true', () => {
    it('should succeed', async () => {
      const data = {
        endpoint: 'uranium',
      }
      mockUraniumResponseRipcordSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    // TODO: This fix fail because of mock bleeding between test cases
    // it('should fail', async () => {
    //   const data = {
    //     endpoint: 'uranium',
    //   }
    //   mockUraniumResponseFailure()

    //   const response = await testAdapter.request(data)
    //   expect(response.statusCode).toBe(502)
    //   expect(response.json()).toMatchSnapshot()
    // })
  })
})
