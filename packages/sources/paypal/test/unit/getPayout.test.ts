import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'test_client_id'
  process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'test_client_secret'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'payout_id not supplied',
        testData: { id: jobID, data: { type: 'BATCH' } },
      },
      {
        name: 'invalid type supplied',
        testData: { id: jobID, data: { payout_id: 'abc', type: 'MIX' } },
      },
    ]

    requests.forEach(req => {
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
