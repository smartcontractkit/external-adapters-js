import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('totalScore api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        matchId: '5527455bb80a5e9884153786aeb5f2b2',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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

  describe('event api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'event',
        eventId: '5527455bb80a5e9884153786aeb5f2b2',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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

  describe('events api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'events',
        sportId: 2,
        date: '2020-09-20T17:00:00Z',
        eventId: '9a35b8986a76eaaea364be331cb453ec',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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
