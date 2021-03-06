import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('stats endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { blockchain: 'BTC' } },
      },
      {
        name: 'blockchain',
        testData: { id: jobID, data: { blockchain: 'BTC' } },
      },
      {
        name: 'coin',
        testData: { id: jobID, data: { coin: 'BTC' } },
      },
      {
        name: 'blockchain difficulty with endpoint',
        testData: { id: jobID, data: { blockchain: 'BTC', endpoint: 'difficulty' } },
      },
      {
        name: 'coing difficulty with endpoint',
        testData: { id: jobID, data: { coin: 'BTC', endpoint: 'difficulty' } },
      },
      {
        name: 'blockchain height',
        testData: { id: jobID, data: { blockchain: 'BTC', endpoint: 'height' } },
      },
      {
        name: 'coin height',
        testData: { id: jobID, data: { coin: 'BTC', endpoint: 'height' } },
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

  describe('error calls @integration', () => {
    const requests = [
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
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
