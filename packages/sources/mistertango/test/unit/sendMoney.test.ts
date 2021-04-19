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
      { name: 'missing all params', testData: { endpoint: 'sendmoney' } },
      {
        name: 'missing amount',
        testData: { endpoint: 'sendmoney', account: 'not_real', details: 'not_real' },
      },
      {
        name: 'missing account',
        testData: { endpoint: 'sendmoney', amount: 10, details: 'not_real' },
      },
      {
        name: 'missing details',
        testData: { endpoint: 'sendmoney', amount: 10, account: 'not_real' },
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
