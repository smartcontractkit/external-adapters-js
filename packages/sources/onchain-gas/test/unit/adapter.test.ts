import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
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
        testData: { data: { numBlocks: 'abc' } },
      },
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
