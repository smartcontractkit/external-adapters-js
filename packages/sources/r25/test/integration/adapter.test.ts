import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockNavResponseFailure, mockNavResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'test-api-key'
    process.env.API_SECRET = 'test-api-secret'
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

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success using price alias', async () => {
      const data = {
        endpoint: 'price',
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid token', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'polygon',
        tokenName: 'invalid',
      }

      mockNavResponseFailure()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should include timestamp from API response', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(json.timestamps).toBeDefined()
      expect(json.timestamps.providerIndicatedTimeUnixMs).toBeDefined()
      expect(typeof json.timestamps.providerIndicatedTimeUnixMs).toBe('number')
    })

    it('should parse currentNav as a number', async () => {
      const data = {
        endpoint: 'nav',
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      mockNavResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const json = response.json()
      expect(typeof json.result).toBe('number')
      expect(json.result).toBe(1.020408163265306)
      expect(json.data.result).toBe(json.result)
    })

    it('should handle missing required parameters', async () => {
      const data = {
        endpoint: 'nav',
        // Missing chainType and tokenName
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json().error).toBeDefined()
    })
  })
})
