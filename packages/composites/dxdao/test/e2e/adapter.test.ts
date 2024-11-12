import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.XDAI_RPC_URL = process.env.XDAI_RPC_URL || 'https://rpc.xdaichain.com/'
  process.env.TIINGO_ADAPTER_URL = process.env.TIINGO_ADAPTER_URL || 'http://localhost:3000'

  describe('successful calls @e2e', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            pairContractAddress: '0x1bDe964eCd52429004CbC5812C07C28bEC9147e9',
          },
        },
      },
      {
        name: 'pair contract address supplied with id',
        testData: {
          data: {
            pairContractAddress: '0x1bDe964eCd52429004CbC5812C07C28bEC9147e9',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).not.toBeFalsy()
        expect(data.data.result).not.toBeFalsy()
      })
    })
  })

  describe('error calls @e2e', () => {
    const requests = [
      {
        name: 'invalid pairContractAddress',
        testData: {
          data: {
            pairContractAddress: 'invalid-address',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
