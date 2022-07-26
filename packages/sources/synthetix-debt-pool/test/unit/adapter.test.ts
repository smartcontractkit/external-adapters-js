import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, setEnvVariables } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import process from 'process'
import { TInputParameters } from '../../src/utils'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.RPC_URL = 'mock-ethereum-rpc-url'
  process.env.OPTIMISM_RPC_URL = 'mock-optimism-rpc-url'
})

afterAll(() => {
  setEnvVariables(oldEnv)
})

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty chainSources', testData: { id: jobID, data: { chainSources: [] } } },
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
