import { assertError } from '@chainlink/ea-test-helpers'
import { Requester } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'

describe('validation error', () => {
  const jobID = '2'
  const execute = makeExecute()
  const requests = [
    {
      name: 'empty data',
      input: { id: jobID, data: {} },
    },
    {
      name: 'unsupported source',
      input: {
        id: jobID,
        data: {
          source: 'NOT_REAL',
          from: 'ETH',
          to: 'USD',
        },
      },
    },
  ]

  requests.forEach((req) => {
    it(`${req.name}`, async () => {
      try {
        await execute(req.input, {})
      } catch (error) {
        const errorResp = Requester.errored(jobID, error)
        assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
      }
    })
  })
})
