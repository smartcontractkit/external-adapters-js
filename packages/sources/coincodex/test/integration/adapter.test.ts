import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

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

  describe('coin price api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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
