import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'BTC', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'BTC', quote: 'EUR' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'ETH', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'ETH', market: 'EUR' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isAbove(data.result, 0)
        assert.isAbove(data.data.result, 0)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
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

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'not_real' } },
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
