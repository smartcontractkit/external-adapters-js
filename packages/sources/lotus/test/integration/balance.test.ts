import { AdapterRequest } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import { mockLotusResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:1234/rpc/v0'
  process.env.API_KEY = process.env.API_KEY || 'test_api_key'
  process.env.API_VERBOSE = 'true'
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
    process.env.CACHE_ENABLED = 'false'
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('with one address', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [{ address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' }],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

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

  describe('with multiple addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        addresses: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

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

  describe('result is an alias for addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      },
    }

    it('should return success', async () => {
      mockLotusResponseSuccess()

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
