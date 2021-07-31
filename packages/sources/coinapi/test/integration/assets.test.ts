import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe.each([
    {
      name: 'id not supplied',
      testData: { data: { base: 'ETH', endpoint: 'assets' } },
    },
    {
      name: 'from/to',
      testData: { id: jobID, data: { from: 'ETH', endpoint: 'assets' } },
    },
    {
      name: 'coin/market',
      testData: { id: jobID, data: { coin: 'ETH', endpoint: 'assets' } },
    },
  ])('successful calls', (req) => {
    it(`${req.name}`, async () => {
      const data = await execute(req.testData as AdapterRequest)
      assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      expect(data.result).toBeGreaterThan(0)
      expect(data.data.result).toBeGreaterThan(0)
    })
  })

  describe.each([
    {
      name: 'multiple bases',
      testData: { id: jobID, data: { base: ['ETH', 'BTC'], endpoint: 'assets' } },
    },
  ])('successful batch calls', (req) => {
    it(`${req.name}`, async () => {
      const data = await execute(req.testData as AdapterRequest)
      assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      expect(Object.keys(data.data.results).length).toBeGreaterThan(0)
    })
  })

  describe.each([
    {
      name: 'base not supplied',
      testData: { id: jobID, data: { quote: 'USD', endpoint: 'assets' } },
    },
  ])('validation error', (req) => {
    it(`${req.name}`, async () => {
      try {
        await execute(req.testData as AdapterRequest)
      } catch (error) {
        const errorResp = Requester.errored(jobID, error)
        assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
      }
    })
  })

  describe.each([
    {
      name: 'unknown base',
      testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
    },
  ])('error calls', (req) => {
    it(`${req.name}`, async () => {
      try {
        await execute(req.testData as AdapterRequest)
      } catch (error) {
        const errorResp = Requester.errored(jobID, error)
        assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
      }
    })
  })
})
