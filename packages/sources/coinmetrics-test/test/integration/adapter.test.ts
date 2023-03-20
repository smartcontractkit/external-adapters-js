import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { mockCoinmetricsResponseSuccess, mockCoinmetricsResponseSuccess2 } from './fixtures'

describe('http', () => {
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
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('price endpoint', () => {
    const data = {
      id,
      data: {
        base: 'BTC',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCoinmetricsResponseSuccess()

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

  describe('burned endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'burned',
        asset: 'eth',
      },
    }

    it('should return success', async () => {
      mockCoinmetricsResponseSuccess2()

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

  describe('total-burned endpoint', () => {
    const data = {
      id,
      data: {
        endpoint: 'total-burned',
        asset: 'eth',
      },
    }

    it('should return success', async () => {
      mockCoinmetricsResponseSuccess2(10000)

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
