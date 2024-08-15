import process from 'process'

import { ServerInstance } from '@chainlink/external-adapter-framework'
import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { SuperTest, Test } from 'supertest'

import { mockResponseSuccess } from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from './setup'

describe('Market status endpoint', () => {
  let spy: jest.SpyInstance

  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    done()
  })

  const context: SuiteContext = {
    req: null,
    server: async () => {
      // workaround for failing integration tests that run in parallel
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10000'
      process.env['METRICS_ENABLED'] = 'false'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    API_KEY: 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  const openData = {
    data: {
      endpoint: 'market-status',
      market: 'forex',
    },
  }
  const closedData = {
    data: {
      endpoint: 'market-status',
      market: 'metals',
    },
  }

  it('should return success with open', async () => {
    mockResponseSuccess()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(openData)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
    expect(response.body.result).toEqual(MarketStatus.OPEN)
  })

  it('should return success with closed', async () => {
    mockResponseSuccess()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(closedData)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
    expect(response.body.result).toEqual(MarketStatus.CLOSED)
  })
})
