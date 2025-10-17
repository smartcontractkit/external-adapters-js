import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import * as process from 'process'
import {
  mockCantonApiExerciseChoiceOnLatestContractResponse,
  mockCantonApiExerciseChoiceResponse,
  mockCantonApiExerciseChoiceWithArgumentResponse,
  mockCantonApiQueryWithFilterResponse,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
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
    it('should return success when exercising a choice without argument', async () => {
      const data = {
        endpoint: 'canton-data',
        url: 'http://localhost:7575',
        templateId: 'example-package-id:Main:Asset',
        contractId: '00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0',
        choice: 'GetValue',
      }

      mockCantonApiExerciseChoiceResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 10000)

    it('should return success when exercising a choice with argument', async () => {
      const data = {
        endpoint: 'canton-data',
        url: 'http://localhost:7575',
        templateId: 'example-package-id:Main:Asset',
        contractId: '00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0',
        choice: 'UpdateValue',
        argument: JSON.stringify({ newValue: 2000 }),
      }

      mockCantonApiExerciseChoiceWithArgumentResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 10000)

    it('should query with filter and exercise choice on latest contract', async () => {
      const data = {
        endpoint: 'canton-data',
        url: 'http://localhost:7575',
        templateId: 'example-package-id:Main:Asset',
        contractFilter: JSON.stringify({ owner: 'Bob' }),
        choice: 'GetValue',
      }

      mockCantonApiQueryWithFilterResponse()
      mockCantonApiExerciseChoiceOnLatestContractResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 10000)
  })
})
