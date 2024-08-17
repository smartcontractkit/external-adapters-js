import { ServerInstance } from '@chainlink/external-adapter-framework'
import { SuperTest, Test } from 'supertest'

import * as fixtures from './fixtures'
import { setupExternalAdapterTest, SuiteContext } from './setup'

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
    CACHE_ENABLED: 'false',
    NCFX_ADAPTER_URL: 'https://ncfx-adapter.com',
    TRADINGHOURS_ADAPTER_URL: 'https://tradinghours-adapter.com',
  }

  setupExternalAdapterTest(envVariables, context)

  it('returns open if tradinghours is open', async () => {
    const market = 'test-1'
    fixtures.mockTradinghoursOpen(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is closed', async () => {
    const market = 'test-2'
    fixtures.mockTradinghoursClosed(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns ncfx if tradinghours is unknown', async () => {
    const market = 'test-3'
    fixtures.mockTradinghoursUnknown(market)
    fixtures.mockNCFXOpen(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns ncfx if tradinghours is failing', async () => {
    const market = 'test-4'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXOpen(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is failing and ncfx is failing', async () => {
    const market = 'test-5'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXError(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is failing and ncfx is unknown', async () => {
    const market = 'test-6'
    fixtures.mockTradinghoursError(market)
    fixtures.mockNCFXUnknown(market)

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send({ data: { market } })
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })
})
