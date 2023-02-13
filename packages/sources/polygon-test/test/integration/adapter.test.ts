import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import {
  mockResponseSuccessConversionEndpoint,
  mockResponseSuccessTickersEndpoint,
} from './fixtures'
import { SuiteContext, setupExternalAdapterTest } from './setup'

describe('rest', () => {
  jest.setTimeout(10000)
  let spy: jest.SpyInstance
  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    done()
  })

  const id = '1'

  const context: SuiteContext = {
    req: null,
    server: async () => {
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '6'
      process.env['METRICS_ENABLED'] = 'false'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    API_KEY: process.env.API_USERNAME || 'fake-api-key',
  }
  setupExternalAdapterTest(envVariables, context)

  describe('forex api', () => {
    const data = {
      id,
      data: {
        endpoint: 'conversion',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessConversionEndpoint()

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

  describe('forex batch api', () => {
    const data = {
      id,
      data: {
        endpoint: 'tickers',
        base: 'USD',
        quote: 'GBP',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessTickersEndpoint()
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
