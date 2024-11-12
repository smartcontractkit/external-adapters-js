import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockCRPCCallResponseSuccess } from './fixtures'
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
    RPC_URL: 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('difficulty endpoint', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'difficulty',
      },
    }

    it('should return success', async () => {
      mockCRPCCallResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('height endpoint', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'height',
      },
    }

    it('should return success', async () => {
      mockCRPCCallResponseSuccess()

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
