import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import {
  mockAdapterResponseSuccess,
  mockXBCIResponseSuccess,
  mockXLCIResponseSuccess,
  mockX30ResponseSuccess,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'
import 'moment-timezone'

const time = '2021-01-02T00:00:00'

jest.mock('moment-timezone', () => {
  const mockFormatFn = jest.fn().mockReturnValue(time)
  const mockSubtractFn = jest.fn().mockReturnValue({ format: mockFormatFn })
  const mockTzFn = jest.fn().mockReturnValue({ subtract: mockSubtractFn })
  const mockMoment = jest.fn().mockReturnValue({ tz: mockTzFn })
  return mockMoment
})

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
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

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('x30 api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        index: 'x30',
        quote: 'USD',
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockAdapterResponseSuccess()
      mockX30ResponseSuccess(time)

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
      expect(response.body).toMatchSnapshot()
    })
  })
})
