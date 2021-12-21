import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'USDC', quote: 'USDT' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'USDC', quote: 'USDT' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'USDC', to: 'USDT' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'USDC', market: 'USDT' } },
      },
      {
        name: 'from/to ETH',
        testData: { id: jobID, data: { from: 'ETH', fromDecimals: 18, to: 'stETH' } },
      },
      {
        name: 'token addresses and decimals provided directly',
        testData: {
          id: jobID,
          data: {
            from: 'NOT_REAL',
            fromAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            fromDecimals: 18,
            to: 'ALSO_NOT_REAL',
            toAddress: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
            toDecimals: 18,
          },
        },
      },
    ]

    ;[requests[0]].forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USDT' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'USDC', quote: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
