import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import {
  mockResponseSuccessConversionEndpoint,
  mockResponseSuccessTickersEndpoint,
  mockEmptyResponseSuccessTickersEndpoint,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('forex api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'conversion',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessConversionEndpoint()

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
  describe('forex batch api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'tickers',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return the proper warning message when the API does not return a response', async () => {
      mockEmptyResponseSuccessTickersEndpoint()
      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(502)
      expect(response.body).toMatchSnapshot()
    })

    it('should return success', async () => {
      mockResponseSuccessTickersEndpoint()

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
