import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('price endpoint', () => {
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
            to: 'USD',
            from: 'COMP',
            coinid: 'specified-coin-id',
          },
        },
        expectedIds: 'specified-coin-id',
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

  describe('symbol to id override', () => {
    const requests = [
      {
        name: 'symbol to id override of a token with an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'GRT',
            symbolToIdOverride: {
              coinpaprika: {
                GRT: 'overridden-token-id',
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
            to: 'USD',
            from: 'AAAA',
            symbolToIdOverride: {
              coinpaprika: {
                AAAA: 'overridden-token-id',
              },
            },
          },
        },
        expectedIds: 'overridden-token-id',
      },
      {
        name: 'multiple symbol to id override of tokens with an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: ['GRT', 'PAX', 'KNC'],
            symbolToIdOverride: {
              coinpaprika: {
                GRT: 'grt-the-graph',
                PAX: 'usdp-paxos-standard-token',
                KNC: 'knc-kyber-network',
                RENFIL: 'fil-filecoin',
              },
            },
          },
        },
        expectedIds: '',
      },
      {
        name: 'symbol to id override of without an existing overrides where "from" is an array',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: ['CCCC'],
            symbolToIdOverride: {
              coinpaprika: {
                AAAA: 'overridden-token-id-a',
                BBBB: 'overridden-token-id-b',
                CCCC: 'overridden-token-id-c',
              },
            },
          },
        },
        expectedIds: 'overridden-token-id-c',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const response = await execute(req.testData as AdapterRequest, {})
          if (Array.isArray(response.data?.results)) {
            for (const result of response.data?.results) {
              expect(result[1]).toBeGreaterThan(0)
            }
          }
        } catch (error) {
          expect(error.message.substr(error.message.indexOf(': ') + 2)).toBe(req.expectedIds)
        }
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
