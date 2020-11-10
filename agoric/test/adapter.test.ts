import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { HTTPSender } from '../src/httpSender'

describe('execute', () => {
  const jobID = '1'

  context('HTTP calls', () => {
    const requests = [
      {
        name: 'request_id not supplied',
        status: 400,
        testData: { data: { payment: '0', result: 'abc' } },
        sends: [
          {
            type: 'oracleServer/error',
            data: {
              queryId: undefined,
              error: `Required parameter not supplied: request_id`,
            },
          },
        ],
      },
      {
        name: 'payment not supplied',
        status: 400,
        testData: { data: { request_id: '3939', result: 'abc' } },
        sends: [
          {
            type: 'oracleServer/error',
            data: {
              queryId: '3939',
              error: `Required parameter not supplied: payment`,
            },
          },
        ],
      },
      {
        name: 'push request',
        status: 200,
        testData: { id: jobID, data: { request_id: 'push-3', payment: '12', result: 'abc' } },
        sends: [
          {
            type: 'oracleServer/reply',
            data: {
              queryId: 'push-3',
              reply: 'abc',
              requiredFee: 0,
            },
          },
        ],
      },
      {
        name: 'normal request',
        status: 200,
        testData: {
          id: jobID,
          data: { request_id: 'push-3', payment: '120000000000000', result: 'abc' },
        },
        sends: [
          {
            type: 'oracleServer/reply',
            data: {
              queryId: 'push-3',
              reply: 'abc',
              requiredFee: 120,
            },
          },
        ],
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const sends: Array<{ type: string; data: unknown }> = []
        const spySend: HTTPSender = async (obj) => {
          sends.push(obj)
          return 200
        }
        const execute = makeExecute(spySend)

        try {
          const data = await execute(req.testData as AdapterRequest)
          assertSuccess({ expected: req.status, actual: data.statusCode }, data, jobID)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: req.status, actual: errorResp.statusCode }, errorResp, jobID)
        }
        assert.deepEqual(sends, req.sends)
      })
    })
  })

  context('validation', () => {
    const mockSend: HTTPSender = () => Promise.resolve(200)
    const execute = makeExecute(mockSend)
    const requests = [
      {
        name: 'normal request_id',
        status: 200,
        testData: {
          id: jobID,
          data: { request_id: '4', payment: '10000000000000000', result: 'abc' },
        },
      },
      {
        name: 'push request_id',
        status: 200,
        testData: {
          id: jobID,
          data: { request_id: 'push-3', payment: '10000000000000000', result: 'def' },
        },
      },
      {
        name: 'zero payment',
        status: 200,
        testData: { id: jobID, data: { request_id: '99', payment: '0', result: 'ghi' } },
      },
      { status: 400, name: 'empty body', testData: {} },
      { status: 400, name: 'empty data', testData: { data: {} } },
      {
        status: 400,
        name: 'payment not supplied',
        testData: { id: jobID, data: { request_id: '3', result: 'abc' } },
      },
      {
        status: 400,
        name: 'request_id not supplied',
        testData: { id: jobID, data: { payment: '0', result: 'def' } },
      },
      {
        status: 400,
        name: 'result not supplied',
        testData: { id: jobID, data: { request_id: '3', payment: '0' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const data = await execute(req.testData as AdapterRequest)
          assertSuccess({ expected: req.status, actual: data.statusCode }, data, jobID)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: req.status, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
