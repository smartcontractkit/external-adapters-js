import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
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
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('Get BTC dominance', () => {
    const data: AdapterRequest = {
      id,
      data: {},
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
