import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

function fail(reason = 'fail was called in a test.') {
  throw new Error(reason)
}

describe('vwap endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('basic request', () => {
    const requests = [
      {
        name: 'basic request without overrides',
        testData: {
          id: jobID,
          data: {
            endpoint: 'vwap',
            to: 'USD',
            from: 'GRT',
          },
        },
        expectedIds: '',
      },
      {
        name: 'basic override',
        testData: {
          id: jobID,
          data: {
            endpoint: 'vwap',
            to: 'USD',
            from: 'GRT',
            override: {
              coinpaprika: {
                GRT: 'this-id-should-not-be-used',
              },
            },
          },
        },
        expectedIds: 'grt-the-graph',
      },
      {
        name: 'request using coinid',
        testData: {
          id: jobID,
          data: {
            endpoint: 'vwap',
            to: 'USD',
            from: 'GRT',
            coinid: 'grt-the-graph',
          },
        },
        expectedIds: 'grt-the-graph',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const response = await execute(req.testData as AdapterRequest, {})
          expect(response.result).toBeGreaterThan(0)
        } catch (error) {
          fail('Test failed due to error in execute')
        }
      })
    })
  })

  describe('symbol to id override', () => {
    const requests = [
      {
        name: 'symbol to id override',
        testData: {
          id: jobID,
          data: {
            endpoint: 'vwap',
            to: 'USD',
            from: 'GRT',
            symbolToIdOverride: {
              coinpaprika: {
                GRT: 'grt-the-graph',
              },
            },
          },
        },
        expectedIds: 'grt-the-graph',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.result).toBeGreaterThan(0)
      })
    })
  })
})
