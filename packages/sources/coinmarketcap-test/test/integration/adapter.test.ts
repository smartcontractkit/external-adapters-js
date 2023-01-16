import {
  mockSuccessfulCoinMarketCapResponse,
  mockSuccessfulGlobalMetricsResponse,
  mockSuccessfulHistoricalCapResponse,
} from './fixtures'
import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'

describe('execute', () => {
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
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10000'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['API_KEY'] = 'fake-api-key'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('crypto endpoint with cid', () => {
    const data = {
      id,
      data: {
        base: 'BTC',
        cid: '1',
        to: 'USD',
      },
    }

    it('should return success', async () => {
      mockSuccessfulCoinMarketCapResponse('id', '1')

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

  describe('marketcap endpoint with slug', () => {
    const data = {
      id,
      data: {
        endpoint: 'marketcap',
        base: 'BTC',
        slug: 'bitcoin',
        to: 'USD',
      },
    }

    it('should return success', async () => {
      mockSuccessfulCoinMarketCapResponse('slug', 'bitcoin')

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

  describe('volume endpoint with base', () => {
    const data = {
      id,
      data: {
        endpoint: 'volume',
        base: 'BTC',
        to: 'USD',
      },
    }

    it('should return success', async () => {
      mockSuccessfulCoinMarketCapResponse('symbol', 'BTC')

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

  describe('globalmarketcap endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'globalmarketcap',
        market: 'USD',
      },
    }

    it('should return success', async () => {
      mockSuccessfulGlobalMetricsResponse('USD')

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

  describe('dominance endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'dominance',
        market: 'BTC',
      },
    }

    it('should return success', async () => {
      mockSuccessfulGlobalMetricsResponse()

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

  describe('historical endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'historical',
        symbol: 'ETH',
        convert: 'BTC',
        start: '2021-07-23T14',
      },
    }

    it('should return success', async () => {
      mockSuccessfulHistoricalCapResponse()

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
