import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import * as process from 'process'
import {
  TEST_TEMPLATE_ID,
  mockExerciseCheckValueAboveOnFilteredContract,
  mockExerciseCheckValueAboveOnLatestFromNoFilter,
  // mockExerciseCheckValueAboveWithProvidedId,
  mockExerciseGetInfoOnLatestFromNoFilter,
  mockQueryByTemplateNoFilter,
  mockQueryWithNameFilter,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['AUTH_TOKEN'] = 'test-jwt-token'
    process.env['BACKGROUND_EXECUTE_MS'] = '1000'
    process.env['URL'] = 'http://127.0.0.1:7575'
    process.env['TEMPLATE_ID'] = TEST_TEMPLATE_ID
    process.env['CHOICE'] = 'GetInfo'
    process.env['ARGUMENT'] = ''
    process.env['CONTRACT_FILTER'] = ''

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

  describe('canton-data endpoint (manual test cases)', () => {
    // Test case 3
    it('should exercise GetInfo on latest contract (no contractId, no argument, no filter)', async () => {
      process.env['CHOICE'] = 'GetInfo'
      process.env['ARGUMENT'] = ''
      process.env['CONTRACT_FILTER'] = ''
      const data = { endpoint: 'canton-data' }

      mockQueryByTemplateNoFilter()
      mockExerciseGetInfoOnLatestFromNoFilter()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.exerciseResult).toBeDefined()
      expect(typeof body.data.result).toBe('string')
    }, 10000)

    // Test case 3
    it('should exercise CheckValueAbove with argument on latest contract (no contractId)', async () => {
      process.env['CHOICE'] = 'CheckValueAbove'
      process.env['ARGUMENT'] = '{"threshold":2000}'
      process.env['CONTRACT_FILTER'] = ''
      const data = { endpoint: 'canton-data' }

      mockQueryByTemplateNoFilter()
      mockExerciseCheckValueAboveOnLatestFromNoFilter()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.exerciseResult).toBeDefined()
      expect(typeof body.data.result).toBe('string')
    }, 10000)

    // Test case 3
    // it('should exercise CheckValueAbove with argument using provided contractID', async () => {
    //   const data = {
    //     endpoint: 'canton-data',
    //     contractId: '0013102064814a98f87bb076314c6b82bdff97211e6cf8281c654d1b0df9c855e8ca03122027c21329e8823932596af34d936e7e25c69d28a1af118ba599732370266b589f',
    //   }
    //
    //   mockExerciseCheckValueAboveWithProvidedId()
    //
    //   const response = await testAdapter.request(data)
    //   expect(response.statusCode).toBe(200)
    //   const body = response.json()
    //   expect(body.data.exerciseResult).toBeDefined()
    //   expect(typeof body.data.result).toBe('string')
    // }, 10000)

    // Test case 4
    it('should query with contractFilter and exercise CheckValueAbove on returned contract', async () => {
      process.env['CHOICE'] = 'CheckValueAbove'
      process.env['ARGUMENT'] = '{"threshold":2000}'
      process.env['CONTRACT_FILTER'] = '{"name":"Laptop"}'
      const data = { endpoint: 'canton-data' }

      mockQueryWithNameFilter()
      mockExerciseCheckValueAboveOnFilteredContract()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.exerciseResult).toBeDefined()
      expect(typeof body.data.result).toBe('string')
    }, 10000)
  })
})
