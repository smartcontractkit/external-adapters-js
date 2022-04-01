import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../../src'
import { mockGamesResponse } from './fixtures'
import { AddressInfo } from 'net'
import { AdapterRequest } from '@chainlink/ea-bootstrap'

let oldEnv: NodeJS.ProcessEnv

const MOCK_KEY = 'mock-key'

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.MLB_API_KEY = process.env.MLB_API_KEY || MOCK_KEY
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
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('fetch mlb schedule by date', () => {
    mockGamesResponse(MOCK_KEY)

    it('should return the correct player information', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          date: '2017-JUL-31',
          sport: 'mlb',
          endpoint: 'schedule',
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return a 400 if date is missing', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          sport: 'mlb',
          endpoint: 'schedule',
        },
      }

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

  describe('fetch mlb game by game id', () => {
    mockGamesResponse(MOCK_KEY)

    it('should return the correct game', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          date: '2017-JUL-31',
          sport: 'mlb',
          endpoint: 'score',
          gameID: 49119,
        },
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should return a 400 if gameID is missing', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          date: '2017-JUL-31',
          sport: 'mlb',
          endpoint: 'score',
        },
      }

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
