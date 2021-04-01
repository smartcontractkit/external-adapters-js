import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('price endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'LINK', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'LINK', quote: 'ETH' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'LINK', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'LINK', market: 'USD' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'LINK' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'LINK', quote: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
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
})
