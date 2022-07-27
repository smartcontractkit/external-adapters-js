import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import { mockCryptoEndpointSuccess } from './cryptoFixtures'
import { mockVwapEndpointSuccess } from './vwapFixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('bravenewcoin', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'test-api-key',
    CLIENT_ID: process.env.CLIENT_ID || 'test-client-id',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('when making a request to bravenewcoin to crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'crypto',
        base: 'ETH',
        quote: 'BTC',
      },
    }

    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        mockCryptoEndpointSuccess()
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

  describe('when making a request to bravenewcoin to vwap endpoint', () => {
    const vwapRequest: AdapterRequest = {
      id: '2',
      data: {
        endpoint: 'vwap',
        base: 'ETH',
      },
    }

    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        mockVwapEndpointSuccess()
        const response = await (context.req as SuperTest<Test>)
          .post('/')
          .send(vwapRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
})
