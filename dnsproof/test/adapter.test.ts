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
          data: {
            domain: 'www5.infernos.io',
            address: '0x4d3407ddfdeb3feb4e8a167484701aced7056826',
          },
        },
        expectedResult: true,
      },
      {
        name: 'domain owned',
        testData: {
          id: jobID,
          data: {
            domain: 'www5.infernos.io',
            address: '0x4d3407ddfdeb3feb4e8a167484701aced7056826',
          },
        },
        expectedResult: true,
      },
      {
        name: 'domain not owned',
        testData: {
          id: jobID,
          data: {
            domain: 'www.test.com',
            address: '0x4d3407ddfdeb3feb4e8a167484701aced7056826',
          },
        },
        expectedResult: false,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isTrue(data.result === req.expectedResult)
        assert.isTrue(data.data.result === req.expectedResult)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'domain not supplied',
        testData: { id: jobID, data: { address: '0x4d3407ddfdeb3feb4e8a167484701aced7056826' } },
      },
      {
        name: 'address not supplied',
        testData: { id: jobID, data: { domain: 'www5.infernos.io' } },
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
