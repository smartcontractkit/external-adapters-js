import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockAccountNotFound, mockAccountSuccess } from './fixtures'
import {} from '../../src/endpoint'
import type { TInputParameters as AccountInputParameters } from '../../src/endpoint/accounts'
// import type { Config } from '../../src/config'
// import { makeConfig } from '../../src'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv

    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('accounts', () => {
    it('successful request', async () => {
      const data: AdapterRequest<AccountInputParameters> = {
        id,
        data: {
          ibanIDs: ['LI6808811000000012345', 'LI6808811000000045345'],
        },
      }

      mockAccountSuccess()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
    it('account not found', async () => {
      const data = {
        id,
        data: {
          ibanIDs: ['LI0000000000000000000', 'LI6808811000000045345'],
        },
      }
      mockAccountNotFound()
      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)

      expect(response.body).toMatchSnapshot()
    })
  })
})
