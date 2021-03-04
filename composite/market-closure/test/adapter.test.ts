import { assert } from 'chai'
import { AdapterRequest } from '@chainlink/types'
import { AdapterError } from '@chainlink/external-adapter'
import { assertSuccess } from '@chainlink/adapter-test-helpers'
import { makeExecute } from '../src'
import { Check } from '../src/checks'
import { PriceAdapter } from '../src/dataProvider'

const result = 123

const adapter = (success: boolean): PriceAdapter => {
  if (!success) {
    return async (input: AdapterRequest) => {
      throw new AdapterError({ jobRunID: input.id })
    }
  }

  return async (input: AdapterRequest) => {
    return {
      jobRunID: input.id,
      statusCode: 200,
      data: { result },
      result,
    }
  }
}

const check = (halted: boolean): Check => async () => halted

const makeMockConfig = (halted = false, priceSuccess = true) => {
  return {
    priceAdapter: adapter(priceSuccess),
    checkAdapter: check(halted),
  }
}

describe('executeWithAdapters', () => {
  context('successful calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'successful adapter call',
        input: { id: jobID, data: { asset: 'FTSE', contract: '0x00', multiply: 1 } },
      },
      {
        name: 'trading halted, use meta data',
        input: {
          id: jobID,
          data: { asset: 'FTSE', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        halted: true,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const execute = makeExecute(makeMockConfig(req.halted))
        const data = await execute(req.input as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, result)
        assert.equal(data.data.result, result)
      })
    })
  })
})
