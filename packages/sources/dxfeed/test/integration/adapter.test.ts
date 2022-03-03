import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockPriceEndpoint } from './fixtures'
import { AddressInfo } from 'net'

describe('dxfeed', () => {
  let server: http.Server
  const oldEnv: NodeJS.ProcessEnv = JSON.parse(JSON.stringify(process.env))
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.CACHE_ENABLED = 'false'
    process.env.API_USERNAME = process.env.API_USERNAME || 'fake-api-username'
    process.env.API_PASSWORD = process.env.API_PASSWORD || 'fake-api-password'
    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    }
  })

  afterAll((done) => {
    process.env = oldEnv

    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('price endpoint', () => {
    const priceRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'TSLA',
      },
    }

    it('should reply with success', async () => {
      mockPriceEndpoint()
      const response = await req
        .post('/')
        .send(priceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
