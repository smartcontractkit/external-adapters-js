import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockMCO2Response } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('mco2 endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {},
    }

    it('should return success', async () => {
      mockMCO2Response()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(balanceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
