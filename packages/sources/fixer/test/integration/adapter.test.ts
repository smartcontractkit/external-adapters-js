import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockConvertResponse, mockLatestResponse, mockResponseFailure } from './fixtures'
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
    CACHE_ENABLED: 'false',
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('convert api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'convert',
        base: 'EUR',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockConvertResponse()

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

  describe('convert api with invalid base', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'convert',
        base: 'NON-EXISTING',
        quote: 'USD',
      },
    }

    it('should return failure', async () => {
      mockResponseFailure()

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

  describe('latest endpoint', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'EUR',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockLatestResponse()

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
