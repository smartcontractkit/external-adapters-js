import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { Config } from '../src/config'

const makeMockConfig = (): Config => {
  return {
    ...Requester.getDefaultConfig(),
    username: 'dummy_user',
    password: 'dummy_pass',
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
        testData: {
          data: { product: 'CPI', year: '2016', make: 'Ferrari', model: 'F12 TDF Coupe' },
        },
      },
      {
        name: 'all required fields',
        testData: {
          id: jobID,
          data: { product: 'CPI', year: '2016', make: 'Ferrari', model: 'F12 TDF Coupe' },
        },
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
      {
        name: 'product not supplied',
        testData: { id: jobID, data: { year: '2016', make: 'Ferrari', model: 'F12 TDF Coupe' } },
      },
      {
        name: 'year not supplied',
        testData: { id: jobID, data: { product: 'CPI', make: 'Ferrari', model: 'F12 TDF Coupe' } },
      },
      {
        name: 'make not supplied',
        testData: { id: jobID, data: { product: 'CPI', year: '2016', model: 'F12 TDF Coupe' } },
      },
      {
        name: 'model not supplied',
        testData: { id: jobID, data: { product: 'CPI', year: '2016', make: 'Ferrari' } },
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
        name: 'unknown make',
        testData: {
          id: jobID,
          data: { product: 'CPI', year: '2016', make: 'NOT_REAL', model: 'F12 TDF Coupe' },
        },
      },
      {
        name: 'unknown model',
        testData: {
          id: jobID,
          data: { product: 'CPI', year: '2016', make: 'Ferrari', model: 'NOT_REAL' },
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
})
