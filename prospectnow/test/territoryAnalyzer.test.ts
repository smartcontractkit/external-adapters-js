import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { propertyZip: 66044 } },
      },
      {
        name: 'aggregate zip',
        testData: { id: jobID, data: { propertyZip: 80123 } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        ;[data.result, data.data.result].forEach((r) => {
          assert.isAbove(r.length, 0)
          assert.isArray(r)
        })
      })
    })
  })

  context('validation error', () => {
    const requests = [
      {
        name: 'empty body',
        testData: {},
        error: {
          statusCode: 500,
        },
      },
      {
        name: 'empty data',
        testData: { data: {} },
        error: {
          statusCode: 500,
        },
      },
      {
        name: 'invalid zip',
        testData: { id: jobID, data: { propertyZip: '123123412309' } },
        error: {
          statusCode: 400,
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error, req.error.statusCode)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  context.skip('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid zip',
        testData: { id: jobID, data: { propertyZip: '' } },
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
