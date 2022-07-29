import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import Fastify, { FastifyInstance } from 'fastify'
import { Action, makeExecute, TInputParameters } from '../../src/adapter'
import { makeConfig } from '../../src/config'

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
            error: `None of aliases used for required key request_id`,
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
            error: `None of aliases used for required key payment`,
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
            requiredFee: '12',
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
            requiredFee: '120000000000000',
          },
        },
      ],
      receive: { ok: true, res: true },
    },
    {
      name: 'bad request_id',
      status: 200,
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
            requiredFee: '120000000000000',
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

  describe('POST to localhost @integration', () => {
    let reqIndex: number
    let sends: Action[] = []
    let server: FastifyInstance

    const port = 18082
    process.env.AG_SOLO_ORACLE_URL = `http://localhost:${port}/api/oracle`
    const execute = makeExecute(makeConfig('AGORICTEST'))
    delete process.env.AG_SOLO_ORACLE_URL

    beforeAll(
      () =>
        new Promise((resolve) => {
          server = Fastify({
            logger: false,
          })
          server.post('/api/oracle', (req, res) => {
            const a = req.body as unknown as Action
            sends.push(a)
            const { queryId } = (a.data as { queryId?: string }) || {}
            if (a.type === 'oracleServer/reply' && queryId === 'bad') {
              res.status(500).send({ ok: false, rej: `invalid queryId ${queryId}` })
            } else {
              res.status(200).send(requests[reqIndex].receive)
            }
          })

          server.listen(port, '0.0.0.0')
          resolve(true)
        }),
    )

    afterAll(() => {
      server.close()
    })

    requests.forEach((req, i) => {
      it(`${req.name}`, async () => {
        reqIndex = i
        sends = []

        try {
          const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
          assertSuccess({ expected: req.status, actual: data.statusCode }, data, jobID)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: req.status, actual: errorResp.statusCode }, errorResp, jobID)
        }
        expect(sends).toEqual(req.sends)
      })
    })
  })
})
