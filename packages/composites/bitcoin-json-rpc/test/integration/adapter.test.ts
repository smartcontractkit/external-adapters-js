import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

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
        name: 'get height with endpoint convention',
        testData: {
          id: jobID,
          data: { endpoint: 'height' },
        },
      },
      {
        name: 'get difficulty with blockchain convention and default endpoint',
        testData: {
          id: jobID,
          data: { blockchain: 'BTC' },
        },
      },
      {
        name: 'get height with common interface',
        testData: {
          id: jobID,
          data: { blockchain: 'BTC', endpoint: 'height' },
        },
      },
      {
        name: 'get difficulty with common interface',
        testData: {
          id: jobID,
          data: { blockchain: 'BTC', endpoint: 'difficulty' },
        },
      },
      {
        name: 'get balances from addresses',
        testData: {
          id: jobID,
          data: {
            addresses: [
              "39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE",
              "addr(35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR)"
            ],
            endpoint: 'scantxoutset'
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'endpoint not existing',
        testData: { id: jobID, data: { endpoint: 'no_op' } },
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
