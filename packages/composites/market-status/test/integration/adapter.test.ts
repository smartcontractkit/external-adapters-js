import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

import { server as startServer } from '../../src'
import * as fixtures from './fixtures'

describe('execute', () => {
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    CACHE_ENABLED: 'false',
    NCFX_ADAPTER_URL: 'https://ncfx-adapter.com',
    TRADINGHOURS_ADAPTER_URL: 'https://tradinghours-adapter.com',
  }

  setupExternalAdapterTest(envVariables, context)

  const forexMarketRequest = {
    id: '1',
    data: {
      market: 'forex',
    },
  } as AdapterRequest

  it('returns open if tradinghours is open', async () => {
    fixtures.mockTradinghoursOpen()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is closed', async () => {
    fixtures.mockTradinghoursClosed()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns ncfx if tradinghours is unknown', async () => {
    fixtures.mockTradinghoursUnknown()
    fixtures.mockNCFXOpen()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns ncfx if tradinghours is failing', async () => {
    fixtures.mockTradinghoursError()
    fixtures.mockNCFXOpen()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is failing and ncfx is failing', async () => {
    fixtures.mockTradinghoursError()
    fixtures.mockNCFXError()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })

  it('returns closed if tradinghours is failing and ncfx is unknown', async () => {
    fixtures.mockTradinghoursError()
    fixtures.mockNCFXUnknown()

    const response = await (context.req as SuperTest<Test>)
      .post('/')
      .send(forexMarketRequest)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })
})
