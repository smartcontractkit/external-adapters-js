import { assert } from 'chai'
import { Execute, AdapterRequest } from '@chainlink/types'
import { AdapterError } from '@chainlink/external-adapter'
import { assertSuccess } from '@chainlink/adapter-test-helpers'
import { executeWithAdapters } from '../src/adapter'

const result = 123

const adapter = (success = true, value?: number): Execute => {
  if (!success) {
    return async (input: AdapterRequest) => {
      throw new AdapterError({ jobRunID: input.id })
    }
  }

  return async (input: AdapterRequest) => {
    return {
      jobRunID: input.id,
      statusCode: 200,
      data: { result: value || result },
      result,
    }
  }
}

describe('executeWithAdapters', () => {
  context('successful calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'successful adapter call',
        input: {
          id: jobID,
          data: { asset: 'BRENT', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        adapters: [adapter()],
        checks: [],
        config: { threshold: { onchain: 0, checks: 0 } },
      },
      {
        name: 'still works with failing adapters',
        input: {
          id: jobID,
          data: { asset: 'BRENT', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        adapters: [adapter(), adapter(false)],
        checks: [],
        config: { threshold: { onchain: 0, checks: 0 } },
      },
      {
        name: 'still works with failing adapters with checks',
        input: {
          id: jobID,
          data: { asset: 'BRENT', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        adapters: [adapter(), adapter(false)],
        checks: [adapter()],
        config: { threshold: { onchain: 0, checks: 0 } },
      },
      {
        name: 'returns onchain value when check threshold is surpassed',
        input: {
          id: jobID,
          data: { asset: 'BRENT', contract: '0x00', multiply: 1 },
          meta: { latestAnswer: result },
        },
        adapters: [adapter()],
        checks: [adapter(true, result * 1000)],
        config: { threshold: { onchain: 0, checks: 10 } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await executeWithAdapters(req.input, req.adapters, req.checks, req.config)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, result)
        assert.equal(data.data.result, result)
      })
    })
  })
})
