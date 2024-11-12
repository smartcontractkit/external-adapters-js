import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockRecordCheckResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('dns record check', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    DNS_PROVIDER: process.env.DNS_PROVIDER || 'google',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('record check endpoint', () => {
    const recordCheckRequest: AdapterRequest = {
      id: '1',
      data: {
        name: 'example.com',
        type: 'TXT',
      },
    }

    it('should return success', async () => {
      mockRecordCheckResponse()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(recordCheckRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
