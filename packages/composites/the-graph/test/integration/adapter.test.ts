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
        name: 'request with reference contract',
        testData: { 
            id: jobID,
            data: {
                "baseCoinTicker": "UNI",
                "quoteCoinTicker": "USDT",
                "referenceContract": "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
                "referenceContractDivisor": "100000000",
                "referenceModifierAction": "divide"
            }
        },
      },
      {
        name: 'request with a pair',
        testData: { 
          id: jobID, 
          data: { 
            "baseCoinTicker": "UNI",
            "quoteCoinTicker": "LINK"
          } 
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).not.toBeNull()
        expect(data.data.result).not.toBeNull()
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'same base and quote tickers',
        testData: { 
          id: jobID, 
          data: { 
            "baseCoinTicker": "LINK",
            "quoteCoinTicker": "LINK"
          } 
        },
      },
      {
        name: 'invalid token',
        testData: { 
          id: jobID, 
          data: { 
            "baseCoinTicker": "NON_EXISTENT_TOKEN",
            "quoteCoinTicker": "LINK"
          } 
        },
      },
      {
        name: 'invalid DEX',
        testData: { 
          id: jobID, 
          data: { 
            "baseCoinTicker": "UNI",
            "quoteCoinTicker": "LINK",
            "dex": "INVALID DEX"
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
