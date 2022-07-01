import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'
import { AddressInfo } from 'net'
import { setupExternalAdapterTest, SuiteContext, EnvVariables } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'

  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables: EnvVariables = {
    API_KEY: process.env.API_KEY || 'fake-api-key',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('forex rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'GBP',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

      const response = await context.req
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
