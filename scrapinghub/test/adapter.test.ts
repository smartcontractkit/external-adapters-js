import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { Config } from '../src/config'

const makeMockConfig = (): Config => {
  return {
    ...Requester.getDefaultConfig(),
    projectId: 'dummy_id',
  }
}

describe('execute', () => {
  const jobID = '1'

  const config = makeMockConfig()
  const execute = makeExecute(config)

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { path: 'ferrari_f12tdf/price/value', result: 'avg' } },
      },
      {
        name: 'all required fields',
        testData: { id: jobID, data: { path: 'ferrari_f12tdf/price/value', result: 'avg' } },
      },
      {
        name: 'result key omitted',
        testData: { id: jobID, data: { path: 'ferrari_f12tdf/price/value' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isAbove(data.result, 0)
        assert.isAbove(data.data.result, 0)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'path not supplied', testData: { id: jobID, data: { result: 'avg' } } },
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
      { name: 'unknown path supplied', testData: { id: jobID, data: { result: 'not_real' } } },
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
