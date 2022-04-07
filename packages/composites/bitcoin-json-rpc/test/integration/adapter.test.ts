import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockCRPCCallResponseSuccess } from './fixtures'
import * as nock from 'nock'
import * as http from 'http'
import { AddressInfo } from 'net'

beforeAll(() => {
  process.env.CACHE_ENABLED = 'false'
  process.env.RPC_URL = 'http://localhost:8545'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('difficulty endpoint', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'difficulty',
      },
    }

    it('should return success', async () => {
      mockCRPCCallResponseSuccess()

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

  describe('height endpoint', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'height',
      },
    }

    it('should return success', async () => {
      mockCRPCCallResponseSuccess()

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
