import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { 
        name: 'empty wethContractAddress', 
        testData: { 
          jobID: 1,
          data: {
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      },
      { 
        name: 'empty pairContractAddress', 
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      }
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
