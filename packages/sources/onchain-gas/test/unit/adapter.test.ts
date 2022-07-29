import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    process.env.ETHEREUM_WS_RPC_URL = process.env.ETHEREUM_WS_RPC_URL || 'ws_rpc_url'
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'rpc_url'
  })

  describe('validation error', () => {
    const requests = [
      {
        name: 'incorrect numBlocks type',
        testData: { id: jobID, data: { numBlocks: 'abc' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          // @ts-expect-error  need to pass wrong typed data to make sure test is failing
          await execute(req.testData, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
