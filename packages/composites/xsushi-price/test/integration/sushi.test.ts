import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockEthereumResponseSuccess } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'

  const context = {
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

  describe('empty request', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'sushi',
      },
    }

    it('should return success', async () => {
      mockEthereumResponseSuccess()

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
