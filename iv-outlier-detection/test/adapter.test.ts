import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const meta = { latestAnswer: 60 }
    const multiply = 1
    const referenceContract = '0x00'

    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { symbol: 'ETH', days: 1, multiply, referenceContract }, meta },
      },
      {
        name: '1 day',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 1, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '2 days',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 2, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '1 week',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 7, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '2 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 14, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '3 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 21, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '4 weeks',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 28, multiply, referenceContract },
          meta,
        },
      },
      {
        name: '1 day BTC',
        testData: {
          id: jobID,
          data: { symbol: 'BTC', days: 1, multiply, referenceContract },
          meta,
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
    const meta = { latestAnswer: 60 }

    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {}, meta } },
      {
        name: 'days not supplied',
        testData: {
          id: jobID,
          data: { symbol: 'USD', referenceContract: '0x00', multiply: 1 },
          meta,
        },
      },
      {
        name: 'symbol not supplied',
        testData: { id: jobID, data: { days: 1, referenceContract: '0x00', multiply: 1 }, meta },
      },
      {
        name: 'referenceContract not supplied',
        testData: { id: jobID, data: { symbol: 'USD', days: 1, multiply: 1 }, meta },
      },
      {
        name: 'multiply amount not supplied',
        testData: { id: jobID, data: { symbol: 'USD', days: 1, referenceContract: '0x00' }, meta },
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
    const meta = { latestAnswer: 60 }
    const referenceContract = '0x00'
    const multiply = 1

    const requests = [
      {
        name: 'unknown symbol',
        testData: {
          id: jobID,
          data: { symbol: 'not_real', days: 1, referenceContract, multiply },
          meta,
        },
      },
      {
        name: 'unknown amount of days',
        testData: {
          id: jobID,
          data: { symbol: 'ETH', days: 77777, referenceContract, multiply },
          meta,
        },
      },
      {
        name: 'on-chain outlier',
        testData: {
          id: jobID,
          data: { symbol: 'BTC', days: 1, referenceContract, multiply },
          meta: { latestAnswer: 77777 },
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
