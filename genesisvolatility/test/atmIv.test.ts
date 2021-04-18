import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('atm-iv endpoint', () => {
  process.env.API_KEY = process.env.API_KEY ?? 'test_API_key'
  const jobID = '1'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { symbol: 'ETH', day: 'tenDayIv', endpoint: 'atm-iv' } },
      },
      {
        name: 'symbol/day',
        testData: { id: jobID, data: { symbol: 'ETH', day: 'tenDayIv', endpoint: 'atm-iv' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isNumber(data.result)
        assert.isNumber(data.data.result)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'empty symbol', testData: { data: { day: 'tenDayIv', endpoint: 'atm-iv' } } },
      { name: 'empty day', testData: { data: { symbol: 'ETH', endpoint: 'atm-iv' } } },
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
        name: 'unknown symbol',
        testData: { id: jobID, data: { symbol: 'not_real', day: 'tenDayIv', endpoint: 'atm-iv' } },
      },
      {
        name: 'unknown day',
        testData: { id: jobID, data: { symbol: 'ETH', day: 'not_real', endpoint: 'atm-iv' } },
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
