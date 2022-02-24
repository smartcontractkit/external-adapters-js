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
        name: 'basic request',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'ETH',
          },
        },
        expectedIds: '1027',
      },
      {
        name: 'basic embedded override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'COMP',
            override: {
              coinmarketcap: {
                COMP: 'this-id-should-not-be-used',
              },
            },
          },
        },
        expectedIds: '5692',
      },
      {
        name: 'request using coinid',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'AAAA',
            cid: '1111',
          },
        },
        expectedIds: '1111',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const response = await execute(req.testData as AdapterRequest, {})
          expect(response.result).toBeGreaterThan(0)
        } catch (error) {
          expect(error.cause.config.params.id).toBe(req.expectedIds)
        }
      })
    })
  })

  describe('symbol to id override', () => {
    const requests = [
      {
        name: 'symbol to id override of a token without an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'AAAA',
            symbolToIdOverride: {
              coinmarketcap: {
                AAAA: '1111',
              },
            },
          },
        },
        expectedIds: '1111',
      },
      {
        name: 'symbol to id override of token with an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: 'COMP',
            symbolToIdOverride: {
              coinmarketcap: {
                COMP: '9999',
              },
            },
          },
        },
        expectedIds: '9999',
      },
      {
        name: 'multiple symbol to id override of a tokens with and without an existing overrides',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            coin: ['COMP', 'FNX', 'FTT', 'AAAA'],
            symbolToIdOverride: {
              coinmarketcap: {
                COMP: '1111',
                FNX: '2222',
                FTT: '3333',
              },
            },
          },
        },
        expectedSymbols: 'COMP,FNX,FTT,AAAA',
      },
      {
        name: 'multiple symbol to id override of a tokens with an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: ['AAAA', 'BBBB', 'COMP'],
            symbolToIdOverride: {
              coinmarketcap: {
                AAAA: '1111',
                BBBB: '2222',
              },
            },
          },
        },
        expectedIds: '1111,2222,5692',
      },
      {
        name: 'multiple symbol to id override of a tokens with and without an existing override',
        testData: {
          id: jobID,
          data: {
            to: 'USD',
            from: ['BCH'],
            symbolToIdOverride: {
              coinmarketcap: {
                AAAA: '1111',
                BCH: '2222',
              },
            },
          },
        },
        expectedIds: '2222',
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const response = await execute(req.testData as AdapterRequest, {})
          expect(response.result).toBeGreaterThan(0)
        } catch (error) {
          if (error.message === 'Execute did not throw an error as expected') {
            fail(error.message)
          }
          if (req.expectedIds) expect(error.cause.config.params.id).toBe(req.expectedIds)
          if (req.expectedSymbols)
            expect(error.cause.config.params.symbol).toBe(req.expectedSymbols)
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
