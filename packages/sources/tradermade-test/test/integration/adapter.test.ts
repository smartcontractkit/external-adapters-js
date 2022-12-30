import { SuperTest, Test } from 'supertest'
import { setupExternalAdapterTest, SuiteContext } from './setup'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { mockForexResponse } from './fixtures'
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
        process.env['RATE_LIMIT_CAPACITY_SECOND'] = '100'
        process.env['METRICS_ENABLED'] = 'false'
        const server = (await import('../../src')).server
        return server() as Promise<ServerInstance>
      },
    }

    const envVariables = {
      API_KEY: process.env.API_KEY || 'fake-api-key',
      WS_API_KEY: process.env.WS_API_KEY || 'fake-api-key',
    }

    setupExternalAdapterTest(envVariables, context)

    describe('forex endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'forex',
          base: 'eth',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockForexResponse()

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

    describe('live endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'live',
          base: 'aapl',
        },
      }

      it('should return success', async () => {
        mockForexResponse()

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
