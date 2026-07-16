import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockTwapErrorResponse, mockTwapResponse } from './fixtures'

describe('twap endpoint', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  const twapData = {
    endpoint: 'twap',
    feedId: '0x0003',
    windowSeconds: 30,
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_USERNAME = 'fake-username'
    process.env.API_PASSWORD = 'fake-password'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockTwapResponse()

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

  it('should return success with TWAP data', async () => {
    const response = await testAdapter.request(twapData)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return result equal to provider result field', async () => {
    const response = await testAdapter.request(twapData)
    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.result).toBe('64640960000000000000000')
    expect(json.data.result).toBe('64640960000000000000000')
    expect(json.data.feedId).toBe('0x0003')
    expect(json.data.samples).toBe(30)
    expect(json.data.decimals).toBe(18)
    expect(json.data.requestedEndTs).toBe(1700000000)
    expect(json.data.windowStartTs).toBe(1699999970)
    expect(json.data.windowEndTs).toBe(1700000000)
    expect(json.data.effectiveWindowStartTs).toBe(1699999971)
    expect(json.data.effectiveWindowEndTs).toBe(1699999997)
  })

  it('should return error when provider returns 500', async () => {
    mockTwapErrorResponse()
    const response = await testAdapter.request({
      endpoint: 'twap',
      feedId: '0x0004',
      windowSeconds: 30,
    })
    expect(response.statusCode).not.toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when required params are missing', async () => {
    const response = await testAdapter.request({ endpoint: 'twap', feedId: '0x0003' })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })
})
