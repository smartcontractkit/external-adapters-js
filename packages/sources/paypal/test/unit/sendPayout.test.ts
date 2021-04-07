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
        name: 'amount not supplied',
        testData: { id: jobID, data: { receiver: 'test' } },
      },
      {
        name: 'receiver not supplied',
        testData: { id: jobID, data: { amount: '10' } },
      },
      {
        name: 'recipient_type not valid',
        testData: {
          id: jobID,
          data: { amount: '10', receiver: 'test', recipient_type: 'TWITTER' },
        },
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
