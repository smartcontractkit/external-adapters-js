import { Adapter, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import * as process from 'process'
import { config } from '../../src/config'
import { inputParameters } from '../../src/endpoint/canton-data'
import { ExerciseResult } from '../../src/shared/canton-client'
import { CantonDataTransport, ResultHandler } from '../../src/transport/canton-data'
import {
  TEST_TEMPLATE_ID,
  mockExerciseWithPriceResponse,
  mockExerciseWithoutPriceResponse,
  mockQueryByTemplateNoFilter,
} from './fixtures'

describe('Canton adapter with custom result handler', () => {
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

    const customResultHandler: ResultHandler = (exerciseResult: ExerciseResult) => {
      return exerciseResult.exerciseResult?.price || 0
    }

    const endpointWithCustomTransport = new AdapterEndpoint({
      name: 'custom-price',
      transport: new CantonDataTransport(customResultHandler),
      inputParameters,
    })

    const adapter = new Adapter({
      name: 'CANTON_CUSTOM',
      defaultEndpoint: 'custom-price',
      endpoints: [endpointWithCustomTransport],
      config,
    }) as any

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

  describe('custom result handler', () => {
    beforeEach(() => {
      nock.cleanAll()
    })

    it('should use custom result handler to extract price from exercise result', async () => {
      const data = { endpoint: 'custom-price' }

      mockQueryByTemplateNoFilter()
      mockExerciseWithPriceResponse()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const body = response.json()

      expect(body.result).toBe(2500.5)
    }, 10000)

    it('should handle missing price field gracefully', async () => {
      const contractId = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9999'
      const data = {
        endpoint: 'custom-price',
        contractId,
      }

      mockExerciseWithoutPriceResponse(contractId)

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      const body = response.json()

      // Should default to 0 when price is missing
      expect(body.result).toBe(0)
    }, 10000)
  })
})
