import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockVwapSuccess } from './fixtures'
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
    API_KEY: process.env.API_KEY || 'test_api_token',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('vwap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        block: 10000000,
        api_key: 'test-key',
        endpoint: 'vwap',
        from: 'AMPL',
        to: 'USD',
      },
    }

    it('should return success', async () => {
      mockVwapSuccess()

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
