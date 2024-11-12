import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockCoinpaprikaAdapterResponseSuccess, mockEthereumResponseSuccess } from './fixtures'
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
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
    COINPAPRIKA_ADAPTER_URL: process.env.COINPAPRIKA_ADAPTER_URL || 'http://localhost:8081',
    API_VERBOSE: true as unknown as string,
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with from/to', () => {
    const data: AdapterRequest = {
      id,
      data: {
        from: 'xSUSHI',
        to: 'USD',
        source: 'coinpaprika',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()
      mockCoinpaprikaAdapterResponseSuccess()

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
