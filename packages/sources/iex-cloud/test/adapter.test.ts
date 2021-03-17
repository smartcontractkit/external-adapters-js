import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { symbol: 'TSLA' } },
      },
      {
        name: 'default stock symbol',
        testData: { id: jobID, data: { symbol: 'TSLA' } },
      },
      {
        name: 'explicit stock symbol',
        testData: { id: jobID, data: { symbol: 'TSLA', endpoint: 'stock' } },
      },
      {
        name: 'crypto from/to',
        testData: { id: jobID, data: { from: 'ETH', to: 'USD', endpoint: 'crypto' } },
      },
      {
        name: 'crypto coin/market',
        testData: { id: jobID, data: { coin: 'ETH', market: 'USD', endpoint: 'crypto' } },
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
        name: 'base not supplied on crypto',
        testData: { id: jobID, data: { quote: 'USD', endpoint: 'crypto' } },
      },
      {
        name: 'quote not supplied on crypto',
        testData: { id: jobID, data: { base: 'ETH', endpoint: 'crypto' } },
      },
      {
        name: 'symbol not supplied on stock',
        testData: { id: jobID, data: { quote: 'USD' } },
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
        name: 'unknown base crypto',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD', endpoint: 'crypto' } },
      },
      {
        name: 'unknown quote crypto',
        testData: { id: jobID, data: { base: 'ETH', quote: 'not_real', endpoint: 'crypto' } },
      },
      {
        name: 'unknown symbol stock',
        testData: { id: jobID, data: { symbol: 'not_real', endpoint: 'stock' } },
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
