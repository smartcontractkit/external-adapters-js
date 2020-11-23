import { assert } from 'chai'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { Requester } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const meta = { latestAnswer: 60 }
    const multiply = 1
    const referenceContract = '0x00'

    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { multiply, referenceContract }, meta },
      },
      {
        name: 'id supplied',
        testData: {
          id: jobID,
          data: { multiply, referenceContract },
          meta,
        },
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
    const meta = { latestAnswer: 60 }

    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {}, meta } },
      {
        name: 'referenceContract not supplied',
        testData: { id: jobID, data: { symbol: 'USD', days: 1, multiply: 1 }, meta },
      },
      {
        name: 'multiply amount not supplied',
        testData: { id: jobID, data: { symbol: 'USD', days: 1, referenceContract: '0x00' }, meta },
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
})
