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
        testData: {
          data: { network: 'ETH', lookup_address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
        },
      },

      {
        name: 'lookup_address',
        testData: {
          id: jobID,
          data: { lookup_address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
        },
      },
      {
        name: 'network/lookup_address',
        testData: {
          id: jobID,
          data: { network: 'ETH', lookup_address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isFalse(data.result)
        assert.isFalse(data.data.result)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'address not supplied',
        testData: { id: jobID, data: { network: 'ETH' } },
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
})
