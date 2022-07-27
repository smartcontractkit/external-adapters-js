import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../../src'
import { mockGamesResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

const MOCK_KEY = 'mock-key'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    MLB_API_KEY: process.env.MLB_API_KEY || MOCK_KEY,
    API_VERBOSE: 'true',
  }

  setupExternalAdapterTest(envVariables, context)
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

      const response = await (context.req as SuperTest<Test>)
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

      const response = await (context.req as SuperTest<Test>)
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

      const response = await (context.req as SuperTest<Test>)
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

      const response = await (context.req as SuperTest<Test>)
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
