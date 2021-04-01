import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import * as ta from '@chainlink/token-allocation-adapter'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

const makeMockConfig = () => {
  return {
    defaultNetwork: 'mainnet',
    taConfig: ta.makeConfig(''),
  }
}

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER_URL = 'ignoreable'
  const execute = makeExecute(makeMockConfig())

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid asset',
        testData: {
          id: jobID,
          data: { asset: 'INVALID_ASSET' },
        },
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
