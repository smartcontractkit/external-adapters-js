import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockContractCallResponseSuccess } from './fixtures'
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
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('function call', () => {
    const data: AdapterRequest = {
      id,
      data: {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'function symbol() view returns (string)',
      },
    }

    it('should return success', async () => {
      mockContractCallResponseSuccess()

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
