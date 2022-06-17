import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import {
  mockResponseSuccessConvertEndpoint,
  mockResponseSuccessLatestEndpoint,
  mockResponseSuccessLatestBtcEndpoint,
} from './fixtures'
import { AddressInfo } from 'net'

describe('execute', () => {
  const id = '1'
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
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

  describe('convert api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'convert',
        base: 'XAU',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessConvertEndpoint()

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

  describe('latest api', () => {
    it('returns success with single base/quote pair', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: 'XAU',
          quote: 'USD',
        },
      }
      mockResponseSuccessLatestEndpoint()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('returns success with batched quote symbols', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: 'BTC',
          quote: ['USD', 'XAU'],
        },
      }
      mockResponseSuccessLatestBtcEndpoint()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should error with batched base symbols', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: ['XAU', 'BTC'],
          quote: 'USD',
        },
      }
      mockResponseSuccessLatestEndpoint()

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
      expect(response.body).toMatchSnapshot()
    })
  })
})
