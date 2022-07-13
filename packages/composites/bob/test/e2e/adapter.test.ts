import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

/**
 * Running these tests requires a connection to a Bitcoin client.
 * Not all supported methods have a test case, just enough to display capability.
 */

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'get data',
        testData: {
          id: jobID,
          data: { chainId: 1, blockNumber: 1500000 },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as unknown as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'chain ID not existing',
        testData: { id: jobID, data: { blockNumber: 0 } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error: any) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
