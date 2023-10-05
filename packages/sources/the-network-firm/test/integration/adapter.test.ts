import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBackedResponseSuccess,
  mockEurrResponseSuccess,
  mockMCO2Response,
  mockSTBTResponseSuccess,
  mockUSDRResponseSuccess,
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

  describe('mco2 endpoint', () => {
    it('should return success', async () => {
      mockMCO2Response()
      const response = await testAdapter.request()
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stbt endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'stbt',
      }
      mockSTBTResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('backed endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'backed',
        accountName: 'IBTA',
      }
      mockBackedResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('account name not found should return error', async () => {
      const data = {
        endpoint: 'backed',
        accountName: 'QQQ',
      }
      mockBackedResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('usdr endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'usdr',
      }
      mockUSDRResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('eurr endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'eurr',
      }
      mockEurrResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
