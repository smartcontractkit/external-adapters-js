import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockResponseSuccessConversionEndpoint,
  mockResponseSuccessTickersEndpoint,
} from './fixtures'
import { AddressInfo } from 'net'
import { conversion } from '../../src/endpoint'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('forex api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'conversion',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessConversionEndpoint()

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
  describe('forex batch api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'tickers',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessTickersEndpoint()

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
