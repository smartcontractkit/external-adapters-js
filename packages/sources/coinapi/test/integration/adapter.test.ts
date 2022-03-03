import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src/index'
import { mockAssetEndpoint, mockCryptoEndpoint } from './fixtures'
import { AddressInfo } from 'net'

describe('coinapi', () => {
  let server: http.Server
  const oldEnv: NodeJS.ProcessEnv = JSON.parse(JSON.stringify(process.env))
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'

    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    } else {
      process.env.API_KEY = 'mock-api-key'
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
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

  describe('crypto endpoint', () => {
    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        const cryptoRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'crypto',
            base: 'ETH',
            quote: 'BTC',
          },
        }
        mockCryptoEndpoint()
        const response = await req
          .post('/')
          .send(cryptoRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('assets endpoint', () => {
    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        const assetRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'assets',
            base: 'ETH',
          },
        }
        mockAssetEndpoint()
        const response = await req
          .post('/')
          .send(assetRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
})
