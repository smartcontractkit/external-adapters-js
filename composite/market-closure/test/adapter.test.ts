import { assert } from 'chai'
import { Execute, AdapterRequest } from '@chainlink/types'
import { AdapterError } from '@chainlink/external-adapter'
import { assertSuccess } from '@chainlink/adapter-test-helpers'
import { executeWithAdapters } from '../src/adapter'
import { Check } from '../src/checks'

const result = 123

const adapter = (success = true): Execute => {
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

const check = (halted = false): Check => async () => halted

describe('executeWithAdapters', () => {
  context('successful calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'successful adapter call',
        input: { id: jobID, data: { asset: 'FTSE', contract: '0x00', multiply: 1 } },
        adapter: adapter(),
        check: check(),
      },
      {
        name: 'trading halted, use meta data',
        input: {
          id: jobID,
          data: { asset: 'FTSE', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        adapter: adapter(),
        check: check(true),
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await executeWithAdapters(req.input as AdapterRequest, req.adapter, req.check)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, result)
        assert.equal(data.data.result, result)
      })
    })
  })
})
