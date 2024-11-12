import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import {
  mockResponseWithMultipleRaces,
  mockResponseWithNationalAndState,
  mockResponseWithNoRaces,
  mockStatusLevelResponse,
} from './fixtures'
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
    API_KEY: process.env.API_KEY || MOCK_KEY,
    API_VERBOSE: process.env.API_VERBOSE || 'true',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with no races', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockResponseWithNoRaces(MOCK_KEY)

    it('should return error', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with multiple races', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'VA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockResponseWithMultipleRaces(MOCK_KEY)

    it('should return error', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with national level response', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2020-11-08',
        statePostal: 'US',
        level: 'state',
        officeID: 'P',
        raceType: 'G',
      },
    }
    mockResponseWithNationalAndState(MOCK_KEY)

    it('should return success', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('with state level response', () => {
    const data: AdapterRequest = {
      id,
      data: {
        date: '2021-06-08',
        statePostal: 'CA',
        level: 'state',
        officeID: 'A',
        raceType: 'D',
      },
    }

    mockStatusLevelResponse(MOCK_KEY)

    it('should return success', async () => {
      const response = await (context.req as SuperTest<Test>)
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
