import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { 
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      },
      {
        name: 'pair contract address supplied with id',
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      },
      {
        name: 'without price feed address',
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9"
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

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid wethContractAddress',
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "invalid-address",
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      },
      {
        name: 'invalid pairContractAddress',
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "pairContractAddress": "invalid-address",
            "xdaiEthUsdPriceFeedAddress": "0xa767f745331D267c7751297D982b050c93985627"
          } 
        },
      },
      {
        name: 'invalid xdaiEthUsdPriceFeedAddress',
        testData: { 
          jobID: 1,
          data: {
            "wethContractAddress": "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
            "pairContractAddress": "0x1bDe964eCd52429004CbC5812C07C28bEC9147e9",
            "xdaiEthUsdPriceFeedAddress": "invalid-address"
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
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
