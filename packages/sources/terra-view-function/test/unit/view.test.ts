import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, setEnvVariables } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import process from 'process'
import { TInputParameters } from '../../src/endpoint'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.COLUMBUS_5_RPC_URL = process.env.COLUMBUS_5_RPC_URL || 'http://localhost:1234/'
})

afterAll(() => {
  setEnvVariables(oldEnv)
})

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'address not supplied',
        testData: { id: jobID, data: { address: '', query: {} } },
      },
      {
        name: 'query not supplied',
        testData: { id: jobID, data: { address: 'abc' } },
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
