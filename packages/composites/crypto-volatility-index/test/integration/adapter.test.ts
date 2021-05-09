import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../../src/adapter'
jest.setTimeout(10000)

describe('execute', () => {
  const jobID = '1'
  const contractAddress = '0x1B58B67B2b2Df71b4b0fb6691271E83A0fa36aC5'
  process.env.COINGECKO_DATA_PROVIDER_URL = 'http://localhost:3000'
  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: { contractAddress, isAdaptive: true, multiply: 1e18, source: 'coingecko' },
        },
      },
      {
        name: 'Calculates without on-chain value',
        testData: {
          id: jobID,
          data: { contractAddress, isAdaptive: false, source: 'coingecko' },
        },
      },
      {
        name: 'Calculates with on-chain value',
        testData: {
          id: jobID,
          data: { contractAddress, isAdaptive: true, multiply: 1e18, source: 'coingecko' },
        },
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const data = await execute(req.testData as AdapterRequest)
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          expect(data.result).toBeGreaterThan(0)
          expect(data.data.result).toBeGreaterThan(0)
        } catch (error) {
          console.log(error)
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
