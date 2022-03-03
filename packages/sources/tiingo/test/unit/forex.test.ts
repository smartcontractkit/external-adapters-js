import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'

describe('execute', () => {
  process.env.API_KEY = process.env.API_KEY ?? 'test_API_key'
  const jobID = '1'
  const execute = makeExecute()
  const endpoint = 'forex'

  describe('validation error', () => {
    const requests = [
      { name: 'empty data', testData: { data: { endpoint } } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { endpoint, quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { endpoint, base: 'GBP' } },
      },
    ]

    requests.forEach((req) => {
      it(req.name, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
