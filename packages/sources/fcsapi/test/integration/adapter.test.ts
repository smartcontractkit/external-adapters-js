import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'
  describe('successful calls @integration', () => {
    const requests = [
      { name: 'id not supplied', testData: { data: { base: 'FTSE' } } },
      { name: 'base', testData: { id: jobID, data: { base: 'N225' } } },
      { name: 'from', testData: { id: jobID, data: { from: 'N225' } } },
      { name: 'asset', testData: { id: jobID, data: { asset: 'N225' } } },
      { name: 'AUD', testData: { id: jobID, data: { asset: 'AUD' } } },
      { name: 'CHF', testData: { id: jobID, data: { asset: 'CHF' } } },
      { name: 'EUR', testData: { id: jobID, data: { asset: 'EUR' } } },
      { name: 'GBP', testData: { id: jobID, data: { asset: 'GBP' } } },
      { name: 'JPY', testData: { id: jobID, data: { asset: 'JPY' } } },
      { name: 'XAU', testData: { id: jobID, data: { asset: 'XAU' } } },
      { name: 'XAG', testData: { id: jobID, data: { asset: 'XAG' } } },
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
        testData: { id: jobID, data: { base: 'not_real' } },
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
