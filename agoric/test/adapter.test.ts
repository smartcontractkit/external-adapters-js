import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { HTTPSender } from '../src/httpSender'

describe('execute', () => {
  const jobID = '1'
  const mockSend: HTTPSender = obj => Promise.resolve(200);

  context.skip('successful calls @integration', () => {
    // TODO: Set up a web server to receive the posts.
    const execute = makeExecute(mockSend);
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'base/quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'USD' } },
      },
      {
        name: 'from/to',
        testData: { id: jobID, data: { from: 'ETH', to: 'USD' } },
      },
      {
        name: 'coin/market',
        testData: { id: jobID, data: { coin: 'ETH', market: 'USD' } },
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

  context('validation', () => {
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
          console.log(data)
          assertSuccess({ expected: req.status, actual: data.statusCode }, data, jobID)
        } catch (error) {
            const errorResp = Requester.errored(jobID, error)
            assertError(
              { expected: req.status, actual: errorResp.statusCode },
              errorResp,
              jobID,
            )
        }
      })
    })
  })

  context.skip('error calls @integration', () => {
    const execute = makeExecute(mockSend)
    const requests = [
      {
        name: 'unknown base',
        testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
      },
      {
        name: 'unknown quote',
        testData: { id: jobID, data: { base: 'ETH', quote: 'not_real' } },
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
