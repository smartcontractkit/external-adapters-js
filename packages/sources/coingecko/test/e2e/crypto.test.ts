import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('price endpoint', () => {
  const jobID = '1'

  describe('symbol to coin id conversion errors', () => {
    const execute = makeExecute()
    const requests = [
      {
        name: 'single coin request with missing coin id',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'AAAA',
            symbolToIdOverrides: {
              coingecko: {
                BBBB: 'overridden-coin-id',
              },
            },
          },
        },
        expectedErrorMessage: "Could not find a coin id for the requested symbol 'aaaa'",
      },
      {
        name: 'multiple coin request with missing coin id',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['BBBB', 'AAAA'],
            symbolToIdOverrides: {
              coingecko: {
                BBBB: 'overridden-coin-id',
              },
            },
          },
        },
        expectedErrorMessage: "Could not find a coin id for the requested symbol 'aaaa'",
      },
      {
        name: 'single coin request with a duplicate coin id',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'eth',
            symbolToIdOverrides: {
              coingecko: {
                BBBB: 'overridden-coin-id',
              },
            },
          },
        },
        expectedErrorMessage: "A duplicate symbol was found for the requested symbol 'eth'.",
      },
      {
        name: 'multiple coin request with a duplicate coin id',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['ada', 'BBBB', 'eth'],
            symbolToIdOverrides: {
              coingecko: {
                BBBB: 'overridden-coin-id',
              },
            },
          },
        },
        expectedErrorMessage: "A duplicate symbol was found for the requested symbol 'ada'.",
      },
      {
        name: 'overrides cause duplicate coin id to be requested',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['ada', 'BBBB'],
            overrides: {
              coingecko: {
                ada: 'CCCC',
              },
            },
            symbolToIdOverrides: {
              coingecko: {
                BBBB: 'duplicate-overridden-coin-id',
                CCCC: 'duplicate-overridden-coin-id',
              },
            },
          },
        },
        expectedErrorMessage:
          "A duplicate was detected for the coin id 'duplicate-overridden-coin-id'.",
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
          throw new Error('Adapter did not produce error as expected.')
        } catch (error) {
          expect(error.message).toBe(req.expectedErrorMessage)
        }
      })
    })
  })

  describe('successful single coin requests', () => {
    const execute = makeExecute()
    const requests = [
      {
        name: 'adapter provided override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'COMP',
          },
        },
      },
      {
        name: 'symbolToIdOverride of a symbol without an existing override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'ETH',
            symbolToIdOverrides: {
              coingecko: {
                ETH: 'ethereum',
              },
            },
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.statusCode).toBe(200)
        expect(response.result).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const execute = makeExecute()
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
          throw new Error('Adapter did not produce error as expected.')
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('successful multiple coin requests', () => {
    const execute = makeExecute()
    const requests = [
      {
        name: 'adapter provided override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['RUNE', 'PAX'],
          },
        },
      },
      {
        name: 'symbolToIdOverride of a symbol with an override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['ETH', 'BTC'],
            symbolToIdOverrides: {
              coingecko: {
                ETH: 'ethereum',
                BTC: 'bitcoin',
              },
            },
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.statusCode).toBe(200)
        const keys = Object.keys(response.data)
        for (let i = 0; i < keys.length - 1; i++) {
          expect(Object.keys(response.data[keys[i]]).length).toBeGreaterThan(0)
        }
      })
    })
  })
})
