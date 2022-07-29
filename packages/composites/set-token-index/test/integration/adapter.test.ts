import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockDataProviderResponses } from './fixtures'
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
    API_VERBOSE: 'true',
    CACHE_ENABLED: 'false',
    RPC_URL: process.env.RPC_URL || 'http://localhost:8545',
    COINMARKETCAP_ADAPTER_URL: process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8082',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with coinmarketcap source', () => {
    const data: AdapterRequest = {
      id,
      data: {
        source: 'coinmarketcap',
        address: '0x33d63Ba1E57E54779F7dDAeaA7109349344cf5F1',
        adapter: '0x78733Fa5e70E3aB61DC49d93921B289e4B667093',
      },
    }

    it('should return success', async () => {
      mockDataProviderResponses()

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
