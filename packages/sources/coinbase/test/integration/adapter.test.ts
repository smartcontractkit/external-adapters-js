import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockNftResponseSuccess, mockRateResponseSuccess } from './fixtures'
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
    API_KEY: process.env.API_KEY || 'fake-api-key',
    NFT_API_ENDPOINT: process.env.NFT_API_ENDPOINT || 'http://fake-nft.endpoint',
    NFT_API_AUTH_HEADER: process.env.NFT_API_AUTH_HEADER || 'fake-nft-auth-header',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('exchange rate api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'BTC',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockRateResponseSuccess()

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

  describe('nft-floor-price api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'nft-floor-price',
        network: 'ethereum-mainnet',
        contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        start: '2022-05-25T12:00:00.000Z',
        end: '2022-05-25T12:00:00.000Z',
      },
    }

    it('should return success', async () => {
      mockNftResponseSuccess()

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
