import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'

/**
 * Running these tests requires a connection to the respective PoR indexers
 * being tested in the tests.
 */

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'Get balances from valid network, chainId & addresses',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                network: 'bitcoin',
                chainId: 'mainnet',
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
              {
                network: 'bitcoin',
                chainId: 'mainnet',
                address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
              },
            ],
            minConfirmations: 6,
          },
        },
      },
      {
        name: 'Get balances from valid network, chainId & addresses w/o minConfirmations',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                network: 'bitcoin',
                chainId: 'mainnet',
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
              {
                network: 'bitcoin',
                chainId: 'mainnet',
                address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
              },
            ],
          },
        },
      },
    ]

    for (const req of requests) {
      it(req.name, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      })
    }
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'PoR indexer not configured',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                network: 'bitconnect',
                chainId: 'mainnet',
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
            ],
          },
        },
      },
      {
        name: 'Missing `network` in addresses input',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                chainId: 'mainnet',
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
            ],
          },
        },
      },
      {
        name: 'Missing `chainId` in addresses input',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                network: 'bitcoin',
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
            ],
          },
        },
      },
      {
        name: 'Missing `network` and `chainId` in addresses input',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
              },
            ],
          },
        },
      },
      {
        name: 'Missing `address` in addresses input',
        testData: {
          id: jobID,
          data: {
            addresses: [
              {
                network: 'bitconnect',
                chainId: 'mainnet',
              },
              {
                network: 'bitcoin',
                chainId: 'mainnet',
                address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
              },
            ],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(req.name, async () => {
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
