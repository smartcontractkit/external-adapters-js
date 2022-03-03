import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src/index'
import {
  mockCryptoEndpoint,
  mockBalanceEndpoint,
  mockMarketCapEndpoint,
  mockVolumeEndpoint,
} from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

describe('amberdata', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'mock-api-key'
    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
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

  describe('when making a request to crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'crypto',
        base: 'ETH',
        quote: 'BTC',
      },
    }

    it('should reply with success', async () => {
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

  describe('when making a request to marketcap endpoint', () => {
    const marketCapRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'marketcap',
        base: 'ETH',
      },
    }

    it('should reply with success', async () => {
      mockMarketCapEndpoint()
      const response = await req
        .post('/')
        .send(marketCapRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('when making a request to volume endpoint', () => {
    const volumeRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'volume',
        base: 'LINK',
        quote: 'USD',
      },
    }

    it('should reply with success', async () => {
      mockVolumeEndpoint()
      const response = await req
        .post('/')
        .send(volumeRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('when making a request to balance endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'balance',
        addresses: [
          { address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1' },
          { address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF' },
        ],
        dataPath: 'addresses',
      },
    }

    it('should reply with success', async () => {
      mockBalanceEndpoint()
      const response = await req
        .post('/')
        .send(balanceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
