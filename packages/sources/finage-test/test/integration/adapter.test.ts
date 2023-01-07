import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { mockResponseSuccess } from './fixtures'
import process from 'process'

describe('execute', () => {
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
        process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10000'
        process.env['METRICS_ENABLED'] = 'false'
        const server = (await import('../../src')).server
        return server() as Promise<ServerInstance>
      },
    }

    const envVariables = {
      API_KEY: process.env.API_KEY || 'fake-api-key',
      WS_SOCKET_KEY: process.env.WS_API_KEY || 'fake-api-key',
    }

    setupExternalAdapterTest(envVariables, context)

    describe('crypto endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'crypto',
          base: 'btc',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

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

    describe('stock endpoint', () => {
      const data = {
        id,
        data: {
          base: 'AAPL',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

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

    describe('forex endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'forex',
          base: 'gbp',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

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

    describe('eod endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'eod',
          base: 'ETH',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

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

    describe('commodities endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'commodities',
          base: 'wti',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

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
})
