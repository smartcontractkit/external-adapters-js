import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockStmaticSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://test-rpc-url/',
  }

  setupExternalAdapterTest(envVariables, context)
  describe('stmatic endpoint', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {},
    }

    it('should return success', async () => {
      mockStmaticSuccess()

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
