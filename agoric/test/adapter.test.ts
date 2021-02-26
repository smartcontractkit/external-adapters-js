import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { Action, makeExecute } from '../src/adapter'
import { makeConfig } from '../src/config'

import express from 'express'
import { Server } from 'http'

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
            error: 'Request failed with status code 500',
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
    process.env.AG_SOLO_ORACLE = `http://localhost:${port}/api/oracle`
    const execute = makeExecute(makeConfig('AGORICTEST'))
    delete process.env.AG_SOLO_ORACLE

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
})
