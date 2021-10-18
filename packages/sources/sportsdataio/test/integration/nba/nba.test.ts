import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../../src'
import { mockSportsDataProviderResponse } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

const MOCK_KEY = 'mock-key'

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.NBA_API_KEY = process.env.NBA_API_KEY || MOCK_KEY
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
  const req = request('localhost:8080')

  beforeAll(async () => {
    server = await startServer()
  })
  afterAll((done) => {
    server.close(done)
  })

  describe('fetch nba player data', () => {
    mockSportsDataProviderResponse(MOCK_KEY)

    it('should return the correct player information', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          date: '2021-OCT-11',
          sport: 'nba',
          endpoint: 'player-stats',
          playerID: 20002528,
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
          sport: 'nba',
          endpoint: 'player-stats',
          playerID: 20002528,
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

    it('should return a 400 if playerID is missing', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          sport: 'nba',
          endpoint: 'player-stats',
          date: '2021-OCT-11',
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
