import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

// testing price aggregation using two adapters
describe('price endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.DATA_PROVIDERS = 'coingecko,coinpaprika'
  process.env.REDUCE_DATA_PROVIDER_URL = 'http://localhost:4000'
  process.env.COINGECKO_DATA_PROVIDER_URL = 'http://localhost:3000'
  process.env.COINPAPRIKA_DATA_PROVIDER_URL = 'http://localhost:3001'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'reducer not supplied',
        testData: { id: jobID, data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'average reducer supplied',
        testData: { id: jobID, data: { reducer: 'average', base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'sum reducer supplied',
        testData: { id: jobID, data: { reducer: 'sum', base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'median reducer supplied',
        testData: { id: jobID, data: { reducer: 'median', base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'min reducer supplied',
        testData: { id: jobID, data: { reducer: 'min', base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'max reducer supplied',
        testData: { id: jobID, data: { reducer: 'max', base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'product reducer supplied',
        testData: { id: jobID, data: { reducer: 'product', base: 'ETH', quote: 'USD' } },
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
