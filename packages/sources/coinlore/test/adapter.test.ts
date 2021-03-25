import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { assert } from 'chai'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'BTC' } },
      },
      {
        name: 'id is supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
      },
      {
        name: 'global marketcap',
        testData: { id: jobID, data: { endpoint: 'globalmarketcap', base: 'USD' } },
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
        name: 'unknown market',
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
