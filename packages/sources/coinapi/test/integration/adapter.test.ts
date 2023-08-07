import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src/index'
import { mockAssetEndpoint, mockCryptoEndpoint } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('coinapi', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    API_KEY: 'mock-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('crypto endpoint', () => {
    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        const cryptoRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'crypto',
            base: 'BTC',
            quote: 'EUR',
          },
        }
        mockCryptoEndpoint()
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(cryptoRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('assets endpoint', () => {
    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        const assetRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'assets',
            base: 'ETH',
          },
        }
        mockAssetEndpoint()
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(assetRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
})
