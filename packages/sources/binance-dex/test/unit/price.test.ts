import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('price endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      {
        name: 'empty body',
        testData: {},
      },
      {
        name: 'empty data',
        testData: { data: {} },
      },
      {
        name: 'base not supplied',
        testData: {
          id: jobID,
          data: { base: '', quote: 'USD' },
        },
      },
      {
        name: 'quote not supplied',
        testData: {
          id: jobID,
          data: { base: 'ETH' },
        },
      },
      {
        name: 'invalid overrides format',
        testData: {
          id: jobID,
          data: {
            base: 'ETH',
            quote: 'USD',
            overrides: {
              ETH: 'ethereum',
            },
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
