import process from 'process'

import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { SuperTest, Test } from 'supertest'

import { mockMarketStatusResponseSuccess } from './fixtures'

describe('Market status endpoint', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  const openData = {
    data: {
      endpoint: 'market-status',
      exchange: 'US',
    },
  }
  const closedData = {
    data: {
      endpoint: 'market-status',
      exchange: 'AD',
    },
  }

  it('should return success with open', async () => {
    mockMarketStatusResponseSuccess()

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
    mockMarketStatusResponseSuccess()

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
