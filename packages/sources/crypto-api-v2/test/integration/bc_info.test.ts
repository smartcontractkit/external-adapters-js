import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('bc_info endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { blockchain: 'bitcoin', endpoint: 'difficulty' } },
      },
      {
        name: 'blockchain difficulty with endpoint',
        testData: { id: jobID, data: { blockchain: 'bitcoin', endpoint: 'difficulty' } },
      },
      {
        name: 'coing difficulty with endpoint',
        testData: { id: jobID, data: { coin: 'bitcoin', endpoint: 'difficulty' } },
      },
      {
        name: 'blockchain height',
        testData: { id: jobID, data: { blockchain: 'bitcoin', endpoint: 'height' } },
      },
      {
        name: 'coin height',
        testData: { id: jobID, data: { coin: 'bitcoin', endpoint: 'height' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      //this is validation request in this case, since of the default behaviour
      {
        name: 'unknown blockchain',
        testData: { id: jobID, data: { blockchain: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, new AdapterError(error))
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
