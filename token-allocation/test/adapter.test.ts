import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute, makeIndex, calculateIndexValue } from '../src/adapter'
import { getPriceAdapter } from '../src/config'
import Decimal from 'decimal.js'

const makeConfig = () => {
  const priceAdapter = getPriceAdapter('coingecko')
  return { priceAdapter, defaultCurrency: 'USD' }
}

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute(makeConfig())

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { components: [], units: [] } },
      },
      {
        name: 'components/units',
        testData: { id: jobID, data: { components: ['DAI'], units: ['1000000000000000000'] } },
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
        name: 'units not supplied',
        testData: { id: jobID, data: { components: ['DAI'] } },
      },
      {
        name: 'components not supplied',
        testData: { id: jobID, data: { units: ['1000000000000000000'] } },
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
        testData: { id: jobID, data: { components: ['DAI'], units: [1000000000000000000] } },
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
    const data = {
      components: ['DAI', 'USDC', 'USDT'],
      units: ['1000000000000000000', '1000000000000000000', '1000000000000000000'],
      currency: 'USD',
    }
    const index = makeIndex(data.components, data.units, data.currency)

    it('symbols are correct', () => {
      data.components.forEach((symbol, i) => {
        assert.strictEqual(symbol, index[i].asset)
      })
    })

    const units = new Decimal(1)
    it('units are correct', () => {
      index.forEach((asset) => {
        assert.strictEqual(asset.units.toString(), units.toString())
      })
    })

    it('currency is correct', () => {
      index.forEach((asset) => {
        assert.strictEqual(asset.currency, data.currency)
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
    const expectedValue = 32
    const indexValue = calculateIndexValue(index)
    it('index value is correct', () => {
      assert.strictEqual(indexValue, expectedValue)
      assert.isAbove(indexValue, 31)
      assert.isBelow(indexValue, 33)
    })
  })
})
