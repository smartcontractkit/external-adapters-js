import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.RPC_URL = process.env.RPC_URL || "https://rpc.xdaichain.com/"
  process.env.TIINGO_DATA_PROVIDER_URL = process.env.TIINGO_DATA_PROVIDER_URL || "http://localhost:3000"

  describe('successful calls @e2e', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { 
          data: {
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "source": "tiingo"
          } 
        },
      },
      {
        name: 'pair contract address supplied with id',
        testData: { 
          jobID: 1,
          data: {
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "source": "tiingo"
          }
        },
      }
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
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
          jobID: 1,
          data: {
            "pairContractAddress": "invalid-address"
          } 
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
