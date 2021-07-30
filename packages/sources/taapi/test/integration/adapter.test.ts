import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'
  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'base/quote',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'from/to',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            from: 'ETH',
            to: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'coin/market',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            coin: 'ETH',
            market: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
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
      {
        name: 'indicator not supplied',
        testData: {
          id: jobID,
          data: {
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'base not supplied',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'quote not supplied',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'exchange not supplied',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            interval: '4h',
          },
        },
      },
      {
        name: 'interval not supplied',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
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
        name: 'unknown base',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'not_real',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'unknown quote',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'not_real',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'unknown indicator',
        testData: {
          id: jobID,
          data: {
            indicator: 'not_real',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
            interval: '4h',
          },
        },
      },
      {
        name: 'unknown exchange',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'not_real',
            interval: '4h',
          },
        },
      },
      {
        name: 'unknown interval',
        testData: {
          id: jobID,
          data: {
            indicator: 'RSI',
            base: 'ETH',
            quote: 'USDT',
            exchange: 'binance',
            interval: 'not_real',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
