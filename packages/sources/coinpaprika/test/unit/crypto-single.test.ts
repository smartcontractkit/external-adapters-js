import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

function fail(reason = 'fail was called in a test.') {
  throw new Error(reason)
}

describe('single price endpoint', () => {
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
            endpoint: 'crypto-single',
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
            endpoint: 'crypto-single',
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
            endpoint: 'crypto-single',
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
          expect(error.message.substr(error.message.indexOf(': ') + 2)).toBe(req.expectedIds)
        }
      })
    })
  })

  describe('crypto single symbol to id override', () => {
    const requests = [
      {
        name: 'symbol to id override of a token with an existing override',
        testData: {
          id: jobID,
          data: {
            endpoint: 'crypto-single',
            to: 'USD',
            from: 'GRT',
            symbolToIdOverride: {
              coinpaprika: {
                GRT: 'fil-filecoin',
              },
            },
          },
        },
        expectedIds: 'overridden-token-id',
      },
      {
        name: 'symbol to id override of token without an existing override',
        testData: {
          id: jobID,
          data: {
            endpoint: 'crypto-single',
            to: 'USD',
            from: 'ETH',
            symbolToIdOverride: {
              coinpaprika: {
                ETH: 'grt-the-graph',
              },
            },
          },
        },
        expectedIds: 'grt-the-graph',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        console.log(req.name)
        try {
          const response = await execute(req.testData as AdapterRequest, {})
          expect(response.result).toBeGreaterThan(0)
        } catch (error) {
          expect(error.message.substr(error.message.indexOf(': ') + 2)).toBe(req.expectedIds)
        }
      })
    })
  })
})
