import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute, calculateIndexValue } from '../src/adapter'
import { makeConfig } from '../src/config'
import { PriceAllocations } from '../src/types'
import { BigNumber } from 'ethers/utils'

describe('execute', () => {
  const jobID = '1'
  process.env.DATA_PROVIDER = 'coingecko'
  const execute = makeExecute(makeConfig())

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { allocations: [] } },
      },
      {
        name: 'allocations',
        testData: {
          id: jobID,
          data: { allocations: [{ symbol: 'DAI', balance: '1000000000000000000', decimals: 18 }] },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      })
    })
  })

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

  context('calculate index value', () => {
    const allocations: PriceAllocations = [
      {
        symbol: 'wBTC',
        balance: 100000000,
        decimals: 8,
        price: 10,
        quote: 'USD',
      },
      {
        symbol: 'DAI',
        balance: new BigNumber('1000000000000000000'),
        decimals: 18,
        price: 1,
        quote: 'USD',
      },
    ]
    const indexValue = calculateIndexValue(allocations)
    it('index value is correct', () => {
      const expectedValue = 11
      assert.strictEqual(indexValue, expectedValue)
    })
  })
})
