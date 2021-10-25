import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { makeConfig } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  process.env.ETH_BALANCE_ADAPTER_URL = 'ignoreable'
  const execute = makeExecute(makeConfig(''))

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid symbol',
        testData: {
          id: jobID,
          data: {
            allocations: [
              {
                symbol: 'UASD',
              },
            ],
          },
        },
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
