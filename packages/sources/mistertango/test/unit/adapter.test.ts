import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  const envOld = process.env
  process.env.API_KEY = 'not_real'
  process.env.API_SECRET = 'not_real'
  process.env.API_USER = 'not_real'

  afterAll(() => {
    process.env = envOld //reset environment variables
  })

  describe('validation error', () => {
    const requests = [
      {
        name: 'unknown endpoint',
        testData: { id: jobID, data: { endpoint: 'not_real' } },
      }
    ]

    requests.forEach((req) => {
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
