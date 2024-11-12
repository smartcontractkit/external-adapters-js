import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import process from 'process'

describe('execute', () => {
  const jobID = '1'
  process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
  const execute = makeExecute()

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
            base: '',
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
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
