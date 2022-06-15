import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import { server as startServer } from '../../src'
import { AddressInfo } from 'net'
import { mockVwapSuccess } from './fixtures'

describe('execute', () => {
  const id = '1'

  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('vwap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        block: 10000000,
        api_key: 'test-key',
        endpoint: 'vwap',
        from: 'AMPL',
        to: 'USD',
      },
    }

    it('should return success', async () => {
      mockVwapSuccess()
      process.env.API_KEY = process.env.API_KEY || 'test_api_token'

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
