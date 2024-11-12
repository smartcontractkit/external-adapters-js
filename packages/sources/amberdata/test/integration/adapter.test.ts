import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src/index'
import {
  mockCryptoEndpoint,
  mockBalanceEndpoint,
  mockMarketCapEndpoint,
  mockVolumeEndpoint,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('amberdata', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'mock-api-key',
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('when making a request to crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'crypto',
        base: 'ETH',
        quote: 'BTC',
      },
    }

    it('should reply with success', async () => {
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

  describe('when making a request to crypto endpoint with an override from config/overrides.json', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'crypto',
        base: 'LUNA',
        quote: 'USD',
      },
    }

    it('should reply with success', async () => {
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

  describe('when making a request to marketcap endpoint', () => {
    const marketCapRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'marketcap',
        base: 'ETH',
      },
    }

    it('should reply with success', async () => {
      mockMarketCapEndpoint()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(marketCapRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('when making a request to volume endpoint', () => {
    const volumeRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'volume',
        base: 'LINK',
        quote: 'USD',
      },
    }

    it('should reply with success', async () => {
      mockVolumeEndpoint()
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(volumeRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('when making a request to balance endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'balance',
        addresses: [
          { address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1' },
          { address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF' },
        ],
        dataPath: 'addresses',
      },
    }

    it('should reply with success', async () => {
      mockBalanceEndpoint()
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
