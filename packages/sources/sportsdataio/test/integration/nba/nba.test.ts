import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../../src'
import { mockSportsDataProviderResponse } from './fixtures'
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
    NBA_API_KEY: process.env.NBA_API_KEY || MOCK_KEY,
    API_VERBOSE: 'true',
  }

  setupExternalAdapterTest(envVariables, context)

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
          sport: 'nba',
          endpoint: 'player-stats',
          playerID: 20002528,
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

    it('should return a 400 if playerID is missing', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          sport: 'nba',
          endpoint: 'player-stats',
          date: '2021-OCT-11',
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
