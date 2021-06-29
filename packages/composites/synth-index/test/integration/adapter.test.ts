import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockCoingeckoResponseFailureRedis, mockCoingeckoResponseSuccess } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.COINGECKO_DATA_PROVIDER_URL = 'http://localhost:8081'
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

describe('synth-index X coingecko', () => {
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    server = await startServer()
  })
  afterAll((done) => server.close(done))
  describe('when making a request to coingecko for sDEFI', () => {
    const sDEFIRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'sDEFI',
        to: 'usd',
        source: 'coingecko',
      },
    }

    describe('and coingecko replies with a success', () => {
      it('should reply with success', async () => {
        mockCoingeckoResponseSuccess()

        const response = await req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
    describe('and coingecko replies with an intermittent failure', () => {
      it('should try 2 times then respond with a 200', async () => {
        mockCoingeckoResponseFailureRedis(1)
        mockCoingeckoResponseSuccess()

        const response = await req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

        expect(response.body).toMatchSnapshot()
      })
    })
    describe('and coingecko replies with a failure repeatedly', () => {
      it('should try 3 times and then fail', async () => {
        mockCoingeckoResponseFailureRedis()

        const response = await req
          .post('/')
          .send(sDEFIRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(500)

        expect(response.body).toMatchSnapshot()
      }, 20000)
    })
  })
})
