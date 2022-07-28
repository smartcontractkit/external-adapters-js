import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import type { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/endpoint'
import { makeConfig } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER_URL = 'ignoreable'
  const execute = makeExecute(makeConfig(''))

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid units',
        testData: {
          id: jobID,
          data: { allocations: [{ symbol: 'DAI', balance: '1000000000000000000', decimals: 18 }] },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
