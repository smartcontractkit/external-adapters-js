import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('validation error', () => {
  process.env.API_KEY = process.env.API_KEY || 'test_api_key'

  const execute = makeExecute()

  it(`asset not supplied`, async () => {
    const testData = {
      id: '1',
      data: {
        endpoint: 'burned',
      },
    }
    try {
      await execute(testData as AdapterRequest<TInputParameters>, {})
    } catch (error: any) {
      const errorResp = Requester.errored(testData.id, error)
      assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, testData.id)
    }
  })
})
