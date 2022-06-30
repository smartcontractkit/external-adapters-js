import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockBalanceResponse, mockBcInfoResponse, mockCryptoResponse } from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('balance endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'balance',
        addresses: [
          {
            address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
            chain: 'testnet',
          },
        ],
        dataPath: 'addresses',
      },
    }

    it('should return success', async () => {
      mockBalanceResponse()

      const response = await context.req
        .post('/')
        .send(balanceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('bc_info endpoint', () => {
    const bcInfoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'difficulty',
        blockchain: 'BTC',
      },
    }

    it('should return success', async () => {
      mockBcInfoResponse()

      const response = await context.req
        .post('/')
        .send(bcInfoRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'BTC',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponse()

      const response = await context.req
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
