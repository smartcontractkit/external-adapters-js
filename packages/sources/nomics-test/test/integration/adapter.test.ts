import {
  mockCryptoResponseSuccess,
  mockFilteredResponseSuccess,
  mockGlobalMarketResponseSuccess,
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
      process.env['API_KEY'] = 'fake-api-key'
      // workaround for failing integration tests that run in parallel
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10000'
      process.env['METRICS_ENABLED'] = 'false'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('globalmarketcap endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'globalmarketcap',
      },
    }

    it('should return success', async () => {
      mockGlobalMarketResponseSuccess()

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

  describe('crypto endpoint', () => {
    const firstReqParams = {
      id,
      data: {
        from: 'BTC',
        to: 'EUR',
      },
    }

    const secondReqParams = {
      id,
      data: {
        from: 'ETH',
        to: 'EUR',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

      await (context.req as SuperTest<Test>)
        .post('/')
        .send(firstReqParams)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect(200)

      // second request to check batching
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(secondReqParams)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('volume endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'volume',
        from: 'BTC',
        to: 'EUR',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('marketcap endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'marketcap',
        from: 'BTC',
        to: 'EUR',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('filtered endpoint', () => {
    const data = {
      id,
      data: {
        from: 'LINK',
        endpoint: 'filtered',
        exchanges: 'binance,coinbase',
      },
    }

    it('should return success', async () => {
      mockFilteredResponseSuccess()

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
