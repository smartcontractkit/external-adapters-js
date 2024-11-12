import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.ACCOUNT = process.env.ACCOUNT ?? 'test_account'
  process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'test_db_username'
  process.env.DATABASE = process.env.DATABASE ?? 'test_database'
  process.env.SCHEMA = process.env.SCHEMA ?? 'test_schema'
  process.env.PRIVATE_KEY = process.env.PRIVATE_KEY ?? 'test_private_key'
  process.env.CLOUD_REGION = process.env.CLOUD_REGION ?? 'test_region'
  process.env.CLOUD_PROVIDER = process.env.CLOUD_PROVIDER ?? 'test_provider'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'state not supplied',
        testData: { id: jobID, data: { state: '', county: 'Autauga' } },
      },
      {
        name: 'county not supplied',
        testData: { id: jobID, data: { state: 'Alabama' } },
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
