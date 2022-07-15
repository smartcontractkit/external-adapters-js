import { AdapterRequest } from '@chainlink/ea-bootstrap'
import process from 'process'
import { server as startServer } from '../../src'
import { mockDataProviderResponses } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    API_VERBOSE: 'true',
    COINMARKETCAP_ADAPTER_URL: process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8082',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('with coinmarketcap source', () => {
    const data: AdapterRequest = {
      id,
      data: {
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockDataProviderResponses()

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
