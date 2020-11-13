import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'
import { HTTPSender, makeHTTPSender } from '../src/httpSender'

import express from 'express'
import { Server } from 'http'

interface Action {
  type: string
  data: unknown
}

describe('execute', () => {
  const jobID = '1'

  const requests = [
    {
      name: 'request_id not supplied',
      status: 400,
      testData: { data: { payment: '0', result: 'abc' } },
      sends: [
        {
          type: 'oracleServer/error',
          data: {
            error: `Required parameter not supplied: request_id`,
          },
        },
      ],
      receive: { ok: true, res: true },
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
      receive: { ok: true, res: true },
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
      receive: { ok: true, res: true },
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
      receive: { ok: true, res: true },
    },
    {
      name: 'bad request_id',
      status: 500,
      testData: {
        id: jobID,
        data: { request_id: 'bad', payment: '120000000000000', result: 'abc' },
      },
      sends: [
        {
          type: 'oracleServer/reply',
          data: {
            queryId: 'bad',
            reply: 'abc',
            requiredFee: 120,
          },
        },
        {
          type: 'oracleServer/error',
          data: {
            queryId: 'bad',
            error: 'oracleServer/reply status 500 is not 2xx',
          },
        },
      ],
      receive: { ok: false, err: 'unrecognized queryId bad' },
    },
  ]

  context('POST to localhost @integration', async () => {
    let reqIndex: number
    let sends: Action[] = []
    let server: Server

    const port = 18082
    const execute = makeExecute(makeHTTPSender(`http://localhost:${port}/api/oracle`))

    before(
      () =>
        new Promise((resolve) => {
          const app = express()
          app.use(express.json())
          app.post('/api/oracle', (req, res) => {
            const a = (req.body as unknown) as Action
            sends.push(a)
            const { queryId } = (a.data as { queryId?: string }) || {}
            if (a.type === 'oracleServer/reply' && queryId === 'bad') {
              res.status(500).json({ ok: false, rej: `invalid queryId ${queryId}` })
            } else {
              res.status(200).json(requests[reqIndex].receive)
            }
          })

          server = app.listen(port, resolve)
        }),
    )

    after(() => {
      server.close()
    })

    requests.forEach((req, i) => {
      it(`${req.name}`, async () => {
        reqIndex = i
        sends = []

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

  context('HTTP calls', () => {
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const sends: Action[] = []
        const spySend: HTTPSender = async (obj) => {
          sends.push(obj)
          return { status: req.status, response: req.receive }
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
    const mockSend: HTTPSender = () =>
      Promise.resolve({
        status: 200,
        response: { ok: true, res: true },
      })
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
