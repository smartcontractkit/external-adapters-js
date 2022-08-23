import { AdapterError, AdapterResponse, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful calls', () => {
    const requests = [
      {
        name: 'historical',
        testData: {
          id: jobID,
          data: { endpoint: 'historical', from: 'btc', to: 'USD', market: '' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = (await execute(
          req.testData as AdapterRequest<TInputParameters>,
          {},
        )) as AdapterResponse
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data?.result && Object.keys(data?.result).length).toBeGreaterThan(0)
        expect(data?.data?.results && Object.keys(data?.data?.results).length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'historical unknown market',
        testData: { id: jobID, data: { endpoint: 'historical', market: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
