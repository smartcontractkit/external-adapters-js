import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute, priceTotalValue } from '../src/adapter'
import { makeConfig } from '../src/config'
import { TokenAllocations } from '../src/types'
import { BigNumber } from 'ethers'

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER_URL = 'ignoreable'
  const execute = makeExecute(makeConfig(''))

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'allocations not supplied',
        testData: { id: jobID, data: {} },
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

  context('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid units',
        testData: {
          id: jobID,
          data: { allocations: [{ symbol: 'DAI', balance: '1000000000000000000', decimals: 18 }] },
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

  context('calculate total price value', () => {
    const allocations: TokenAllocations = [
      {
        symbol: 'wBTC',
        balance: 100000000,
        decimals: 8,
      },
      {
        symbol: 'DAI',
        balance: BigNumber.from('1000000000000000000'),
        decimals: 18,
      },
    ]

    it('price value is correct #1', () => {
      const data = {
        wBTC: {
          quote: {
            USD: {
              price: 10,
            },
          },
        },
        DAI: {
          quote: {
            USD: {
              price: 1,
            },
          },
        },
      }
      const value = priceTotalValue(allocations, 'USD', data)
      const expectedValue = 11
      assert.strictEqual(value, expectedValue)
    })

    it('price value is correct #2', () => {
      const data = {
        wBTC: {
          quote: {
            USD: {
              price: 33.2,
            },
          },
        },
        DAI: {
          quote: {
            USD: {
              price: 0.9,
            },
          },
        },
      }
      const value = priceTotalValue(allocations, 'USD', data)
      const expectedValue = 34.1
      assert.strictEqual(value, expectedValue)
    })
  })
})
