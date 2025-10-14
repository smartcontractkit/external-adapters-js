import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import * as process from 'process'
import { mockCantonApiErrorResponse, mockCantonApiResponse } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['JSON_API'] = 'http://localhost:7575'
    process.env['AUTH_TOKEN'] = 'test-jwt-token'
    process.env['BACKGROUND_EXECUTE_MS'] = '1000'

    const mockDate = new Date('2025-10-14T00:00:00.000Z')
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

  describe('canton-data endpoint', () => {
    it('should return success when querying contracts with valid templateId', async () => {
      const data = {
        endpoint: 'canton-data',
        templateId: 'example-package-id:Main:Asset',
      }

      mockCantonApiResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 10000)

    it('should handle errors when Canton API returns failure', async () => {
      const data = {
        endpoint: 'canton-data',
        templateId: 'invalid-template-id',
      }

      mockCantonApiErrorResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    }, 10000)
  })
})
