import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import * as ta from '@chainlink/token-allocation-adapter'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute, toFixedMax } from '../../src/adapter'

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

  describe('validation error', () => {
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
})

describe('toFixedMax', () => {
  it('should handle trailing zeros', () => {
    expect(toFixedMax('0.0', 0)).toEqual('0')
    expect(toFixedMax('0.10', 1)).toEqual('0.1')
    expect(toFixedMax('0.10', 0)).toEqual('0')
  })

  it('should handle leading zeros', () => {
    expect(toFixedMax('00.0', 0)).toEqual('0')
    expect(toFixedMax('00.10', 1)).toEqual('0.1')
    expect(toFixedMax('00.10', 0)).toEqual('0')
  })
})
