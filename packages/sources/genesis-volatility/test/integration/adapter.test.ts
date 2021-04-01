import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  process.env.API_KEY = 'test_api_key'

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { symbol: 'ETH', result: 'oneDayIv' } },
      },
      {
        name: '1 day',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'oneDayIv' } },
      },
      {
        name: '2 days',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'twoDayIv' } },
      },
      {
        name: '1 week',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'sevenDayIv' } },
      },
      {
        name: '2 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'fourteenDayIv' },
        },
      },
      {
        name: '3 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'twentyOneDayIv' },
        },
      },
      {
        name: '4 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', result: 'twentyEightDayIv' },
        },
      },
      {
        name: '1 day BTC',
        testData: { id: jobID, data: { symbol: 'BTC', result: 'oneDayIv' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await makeExecute()(req.testData as AdapterRequest)
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
      {
        name: 'symbol not supplied',
        testData: { id: jobID, data: { result: 'oneDayIv' } },
      },
      {
        name: 'result not supplied',
        testData: { id: jobID, data: { symbol: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await makeExecute()(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown symbol',
        testData: { id: jobID, data: { base: 'not_real', result: 'oneDayIv' } },
      },
      {
        name: 'unknown result',
        testData: { id: jobID, data: { symbol: 'ETH', result: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await makeExecute()(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
