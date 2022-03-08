import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import coinsList from './coinsList.json'
import nock from 'nock'

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
        expectedErrorMessage:
          "An overlapping coin id was found for the requested symbol 'eth' and no override was provided.",
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
        expectedErrorMessage:
          "An overlapping coin id was found for the requested symbol 'ada' and no override was provided.",
      },
    ]

    requests.forEach((req) => {
      nock('https://api.coingecko.com/api/v3').get('/coins/list').reply(200, coinsList)
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
        name: 'basic request',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'clap',
          },
        },
        expectedQuery: {
          ids: 'cardashift',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            cardashift: {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          result: 9999.99,
        },
      },
      {
        name: 'adapter provided override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'COMP',
          },
        },
        expectedQuery: {
          ids: 'compound-governance-token',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            'compound-governance-token': {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          result: 9999.99,
        },
      },
      {
        name: 'symbolToIdOverride of a symbol with an existing override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'COMP',
            symbolToIdOverrides: {
              coingecko: {
                COMP: 'overridden-coin-id',
              },
            },
          },
        },
        expectedQuery: {
          ids: 'overridden-coin-id',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            'overridden-coin-id': {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          result: 9999.99,
        },
      },
      {
        name: 'symbolToIdOverride of a symbol without an existing override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: 'eth',
            symbolToIdOverrides: {
              coingecko: {
                eth: 'overridden-coin-id',
              },
            },
          },
        },
        expectedQuery: {
          ids: 'overridden-coin-id',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            'overridden-coin-id': {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          result: 9999.99,
        },
      },
    ]

    requests.forEach((req) => {
      nock('https://api.coingecko.com/api/v3')
        .get('/coins/list')
        .reply(200, coinsList)
        .get(/\/simple\/price*/)
        .query((query) => {
          return query.ids === req.expectedQuery.ids
        })
        .reply(req.mockResponse.statusCode, req.mockResponse.body)
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.statusCode).toBe(req.expectedResponse.statusCode)
        expect(response.result).toBe(req.expectedResponse.result)
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
        name: 'basic request',
        testData: {
          id: '9',
          data: {
            to: ['USD', 'EUR'],
            from: ['allbi', '$ads'],
          },
        },
        expectedQuery: {
          ids: 'all-best-ico,alkimi',
          vs_currencies: 'USD,EUR',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            alkimi: {
              usd: 9999.99,
              eur: 1111.11,
            },
            'all-best-ico': {
              usd: 9999.99,
              eur: 1111.11,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          data: {
            alkimi: { usd: 9999.99, eur: 1111.11 },
            'all-best-ico': { usd: 9999.99, eur: 1111.11 },
          },
        },
      },
      {
        name: 'adapter provided override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['RUNE', 'PAX'],
          },
        },
        expectedQuery: {
          ids: 'compound-governance-token,paxos-standard,thorchain',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            'compound-governance-token': {
              usd: 9999.99,
            },
            'paxos-standard': {
              usd: 9999.99,
            },
            thorchain: {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          data: {
            'compound-governance-token': { usd: 9999.99 },
            'paxos-standard': { usd: 9999.99 },
            thorchain: { usd: 9999.99 },
          },
        },
      },
      {
        name: 'symbolToIdOverride of a symbol with an existing override',
        testData: {
          id: '1',
          data: {
            to: 'USD',
            from: ['COMP', 'PAX', 'RUNE'],
            symbolToIdOverrides: {
              coingecko: {
                PAX: 'overridden-coin-id',
              },
            },
          },
        },
        expectedQuery: {
          ids: 'compound-governance-token,overridden-coin-id,thorchain',
          vs_currencies: 'USD',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            'compound-governance-token': {
              usd: 9999.99,
            },
            'overridden-coin-id': {
              usd: 9999.99,
            },
            thorchain: {
              usd: 9999.99,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          data: {
            'compound-governance-token': { usd: 9999.99 },
            'overridden-coin-id': { usd: 9999.99 },
            thorchain: { usd: 9999.99 },
          },
        },
      },
      {
        name: 'symbolToIdOverride of a symbol without an existing override',
        testData: {
          id: '1',
          data: {
            to: ['USD', 'JPY'],
            from: ['half', 'bch', 'ada'],
            symbolToIdOverrides: {
              coingecko: {
                bch: 'overridden-id-a',
                ada: 'overridden-id-b',
              },
            },
          },
        },
        expectedQuery: {
          ids: '0-5x-long-bitcoin-token,overridden-id-a,overridden-id-b',
          vs_currencies: 'USD,JPY',
          include_market_cap: 'false',
          include_24hr_vol: 'false',
        },
        mockResponse: {
          statusCode: 200,
          body: {
            '0-5x-long-bitcoin-token': {
              usd: 9999.99,
              jpy: 1111.11,
            },
            'overridden-id-a': {
              usd: 9999.99,
              jpy: 1111.11,
            },
            'overridden-id-b': {
              usd: 9999.99,
              jpy: 1111.11,
            },
          },
        },
        expectedResponse: {
          statusCode: 200,
          data: {
            '0-5x-long-bitcoin-token': { usd: 9999.99, jpy: 1111.11 },
            'overridden-id-a': { usd: 9999.99, jpy: 1111.11 },
            'overridden-id-b': { usd: 9999.99, jpy: 1111.11 },
          },
        },
      },
    ]

    requests.forEach((req) => {
      nock('https://api.coingecko.com/api/v3')
        .get('/coins/list')
        .reply(200, coinsList)
        .get(/\/simple\/price*/)
        .query((query) => {
          const expectedIds = req.expectedQuery.ids.split(',')
          expectedIds.forEach((id) => {
            if (!query.ids.includes(id)) return false
          })
          return true
        })
        .reply(req.mockResponse.statusCode, req.mockResponse.body)
    })

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.statusCode).toBe(req.expectedResponse.statusCode)
        const keys = Object.keys(response.data)
        for (let i = 0; i < keys.length - 1; i++) {
          expect(response.data[keys[i]]).toEqual(req.expectedResponse.data[keys[i]])
        }
      })
    })
  })
})
