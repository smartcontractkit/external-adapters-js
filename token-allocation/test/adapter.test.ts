import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute, makeIndex, calculateIndexValue } from '../src/adapter'
import { makeConfig } from '../src/config'
import Decimal from 'decimal.js'
import { Allocations } from '../src/types'

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

  context('make index', () => {
    const allocations: Allocations = [
      {
        symbol: 'wBTC',
        balance: 100000001,
        decimals: 8,
      },
      {
        symbol: 'DAI',
        balance: 1000000000000,
        decimals: 18,
      },
    ]
    const expectedUnits: any = {
      wBTC: 1.00000001,
      DAI: 0.000001,
    }
    const currency = 'USD'
    const index = makeIndex(allocations, currency, 1e18)

    it('symbols are correct', () => {
      allocations.forEach(({ symbol }, i) => {
        assert.strictEqual(symbol, index[i].asset)
      })
    })

    it('units are correct', () => {
      index.forEach((asset) => {
        assert.strictEqual(asset.units.toString(), expectedUnits[asset.asset].toString())
      })
    })

    it('currency is correct', () => {
      index.forEach((asset) => {
        assert.strictEqual(asset.currency, currency)
      })
    })
  })

  context('calculate index value', () => {
    const index = [
      {
        asset: 'A',
        units: new Decimal(2),
        price: 1,
        currency: 'USD',
      },
      {
        asset: 'B',
        units: new Decimal(5),
        price: 2,
        currency: 'USD',
      },
      {
        asset: 'C',
        units: new Decimal(1),
        price: 20,
        currency: 'USD',
      },
    ]
    const indexValue = calculateIndexValue(index)
    it('index value is correct', () => {
      const expectedValue = 32
      assert.strictEqual(indexValue, expectedValue)
    })
  })
})
