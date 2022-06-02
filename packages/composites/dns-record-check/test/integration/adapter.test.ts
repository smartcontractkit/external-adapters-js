import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockRecordCheckResponse } from './fixtures'

describe('dns record check', () => {
  let fastify: FastifyInstance
  let req =
    SuperTest <
    Test >
    beforeAll(async () => {
      process.env.CACHE_ENABLED = 'false'
      process.env.DNS_PROVIDER = process.env.DNS_PROVIDER || 'google'
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

  describe('record check endpoint', () => {
    const recordCheckRequest: AdapterRequest = {
      id: '1',
      data: {
        name: 'example.com',
        type: 'TXT',
      },
    }

    it('should return success', async () => {
      mockRecordCheckResponse()

      const response = await req
        .post('/')
        .send(recordCheckRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
