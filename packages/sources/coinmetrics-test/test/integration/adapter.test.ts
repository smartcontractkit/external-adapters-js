import { mockBurnedSuccess, mockPriceSuccess, mockTotalBurnedSuccess } from './fixtures'
import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'

describe('execute', () => {
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
    CACHE_ENABLED: 'false',
    API_ENDPOINT: process.env.API_ENDPOINT || 'http://localhost:18081',
    API_KEY: process.env.API_KEY || 'test_key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('price api', () => {
    const data = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockPriceSuccess()

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

  describe('total-burned api', () => {
    const data = {
      id,
      data: {
        asset: 'eth',
        frequency: '1d',
        pageSize: 10000,
        startTime: '2021-09-20',
        endTime: '2021-09-25',
        endpoint: 'total-burned',
      },
    }

    it('should return success', async () => {
      mockTotalBurnedSuccess()

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

  describe('burned api', () => {
    const data = {
      id,
      data: {
        asset: 'eth',
        frequency: '1d',
        endpoint: 'burned',
      },
    }

    it('should return success', async () => {
      mockBurnedSuccess()

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
