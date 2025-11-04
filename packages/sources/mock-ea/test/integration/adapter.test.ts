import { AdapterRequest } from '@chainlink/ea-bootstrap'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)
  describe('price api', () => {
    const data: AdapterRequest = { id, data: {} }

    it('should return success', async () => {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body.data.result).toBe(1000)
    })
  })
})
