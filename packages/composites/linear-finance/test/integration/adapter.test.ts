import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import {
  mockAdapterResponseSuccess,
  mockXBCIResponseSuccess,
  mockXLCIResponseSuccess,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import 'moment-timezone'

const time = '2021-01-02T00:00:00'

jest.mock('moment-timezone', () => {
  const mockFormatFn = jest.fn().mockReturnValue(time)
  const mockTzFn = jest.fn().mockReturnValue({
    format: mockFormatFn,
  })
  return jest.fn().mockReturnValue({
    tz: mockTzFn,
  })
})

describe('execute', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }
  const envVariables = {
    API_KEY: 'test-key',
    CACHE_ENABLED: 'false',
    COINMARKETCAP_ADAPTER_URL: process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8082',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('xbci api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        index: 'xbci',
        quote: 'USD',
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockAdapterResponseSuccess()
      mockXBCIResponseSuccess(time)

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

  describe('xlci api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        index: 'xlci',
        quote: 'USD',
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockAdapterResponseSuccess()
      mockXLCIResponseSuccess(time)

      const response = await context.req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      expect(response.body).toMatchSnapshot()
    })
  })
})
