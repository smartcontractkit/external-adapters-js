import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockCoinmarketcapAdapter } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.COINMARKETCAP_ADAPTER_URL =
    process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8081'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
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

  describe('with to/from dates', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        fromDate: '2021-11-01',
        toDate: '2021-11-08',
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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

  describe('with from date and days', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        fromDate: '2021-11-01',
        days: 7,
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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

  describe('with to date and days', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'ETH',
        to: 'USD',
        toDate: '2021-11-08',
        days: 7,
        source: 'coinmarketcap',
        interval: '1d',
      },
    }

    it('should return success', async () => {
      mockCoinmarketcapAdapter()

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
