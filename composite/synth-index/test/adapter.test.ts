import { Requester } from '@chainlink/external-adapter'
import { assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import * as ta from '@chainlink/token-allocation-adapter'

const makeMockConfig = (provider: string) => {
  return {
    defaultNetwork: 'mainnet',
    taConfig: ta.makeConfig('', provider),
  }
}

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER_URL = 'ignoreable'
  const execute = makeExecute(makeMockConfig('coingecko'))

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'asset not supplied',
        testData: { id: jobID, data: {} },
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

  context('error calls @integration', () => {
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
