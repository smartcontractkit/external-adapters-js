import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      { name: 'id not supplied', testData: { data: { base: 'BZ' } } },
      { name: 'base', testData: { id: jobID, data: { base: 'BZ' } } },
      { name: 'from', testData: { id: jobID, data: { from: 'BZ' } } },
      { name: 'asset', testData: { id: jobID, data: { asset: 'BZ' } } },
      { name: 'type', testData: { id: jobID, data: { type: 'BZ' } } },
      { name: 'brent mapping', testData: { id: jobID, data: { market: 'Brent' } } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await makeExecute()(req.testData as AdapterRequest)
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
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await makeExecute()(req.testData as AdapterRequest)
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
        testData: { id: jobID, data: { base: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await makeExecute()(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
