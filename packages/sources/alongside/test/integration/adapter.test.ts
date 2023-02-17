import * as process from 'process'
import { SuperTest, Test } from 'supertest'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { mockResponseSuccess } from './fixtures'
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
    ACCESS_KEY: process.env.ACCESS_KEY || 'fake-access-key',
    PASSPHRASE: process.env.PASSPHRASE || 'fake-passphrase',
    SIGNING_KEY: process.env.SIGNING_KEY || 'fake-signing-key',
    PORTFOLIO_ID: process.env.PORTFOLIO_ID || 'fake-portfolio',
  }
  setupExternalAdapterTest(envVariables, context)

  describe('portfolio api', () => {
    const data = {
      id,
      data: {},
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
