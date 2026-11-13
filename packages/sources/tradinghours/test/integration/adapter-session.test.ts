import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockSessionSuccess } from './fixtures'

describe('Market status endpoint', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['API_KEY'] = 'fake-api-key'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
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

  it('should return failure with invalid market', async () => {
    const response = await testAdapter.request({
      endpoint: 'market-session',
      market: 'lol',
      type: '24/5',
      timezone: 'America/New_York',
    })
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success', async () => {
    mockSessionSuccess()
    const response = await testAdapter.request({
      endpoint: 'market-session',
      market: 'nyse',
      type: '24/5',
      timezone: 'America/New_York',
    })
    expect(response.json()).toMatchSnapshot()
  })

  it('should pass each phase end through as endTime (tradinghours ADR-0001)', async () => {
    mockSessionSuccess()
    const response = await testAdapter.request({
      endpoint: 'market-session',
      market: 'nyse',
      type: '24/5',
      timezone: 'America/New_York',
    })
    const result = response.json().data.result
    // Explicit assertions (not snapshot): endTime is the additive field callers use
    // to derive closed-span starts, so its exact values are asserted here.
    expect(result).toStrictEqual([
      {
        status: 4,
        statusString: 'OVERNIGHT',
        time: '2022-12-31T20:00:00-05:00',
        endTime: '2022-01-01T04:00:00-05:00',
      },
      {
        status: 1,
        statusString: 'PRE_MARKET',
        time: '2022-01-01T04:00:00-05:00',
        endTime: '2022-01-01T09:30:00-05:00',
      },
      {
        status: 2,
        statusString: 'REGULAR',
        time: '2022-01-01T09:30:00-05:00',
        endTime: '2022-01-01T16:00:00-05:00',
      },
      {
        status: 3,
        statusString: 'POST_MARKET',
        time: '2022-01-01T16:00:00-05:00',
        endTime: '2022-01-01T20:00:00-05:00',
      },
    ])
  })
})
