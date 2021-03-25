import { assert } from 'chai'
import { Requester } from '@chainlink/ea-bootstrap'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const contractAddress = '0x0BD102ef50a6a133B38Bf3Bd3d40cE36cc1aB5A8'
  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { contractAddress, isAdaptive: true, multiply: 1e18 } },
      },
      {
        name: 'Calculates without on-chain value',
        testData: {
          id: jobID,
          data: { contractAddress, isAdaptive: false },
        },
      },
      {
        name: 'Calculates with on-chain value',
        testData: {
          id: jobID,
          data: { contractAddress, isAdaptive: true, multiply: 1e18 },
        },
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const data = await execute(req.testData as AdapterRequest)
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
        } catch (error) {
          console.log(error)
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
