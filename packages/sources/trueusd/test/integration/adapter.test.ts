import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseFailure, mockResponseSuccess } from './fixtures'

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

  describe('trueusd endpoint', () => {
    it('should return success trust', async () => {
      mockResponseSuccess()
      const response = await testAdapter.request({ field: 'totalTrust' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for token', async () => {
      mockResponseSuccess()
      const response = await testAdapter.request({ field: 'totalToken' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success when given a chain', async () => {
      mockResponseSuccess()
      const data = {
        chain: 'AVA',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success when given a chain and field', async () => {
      mockResponseSuccess()
      const data = {
        chain: 'TUSD (AVAX)',
        field: 'totalTokenByChain',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when ripcord true', async () => {
      nock.cleanAll()
      mockResponseFailure()
      const data = {
        chain: 'AVA',
        field: 'test',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
