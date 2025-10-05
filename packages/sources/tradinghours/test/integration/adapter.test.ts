import { MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

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
    endpoint: 'market-status',
    market: 'forex',
  }
  const openDataUppercase = {
    endpoint: 'market-status',
    market: 'FOREX',
  }
  const closedData = {
    endpoint: 'market-status',
    market: 'metals',
  }

  it('should return success with open', async () => {
    mockResponseSuccess()
    const response = await testAdapter.request(openData)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.OPEN)
  })

  it('should return success with closed', async () => {
    mockResponseSuccess()
    const response = await testAdapter.request(closedData)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.CLOSED)
  })

  it('should return success with open with uppercase market', async () => {
    mockResponseSuccess()
    const response = await testAdapter.request(openDataUppercase)
    expect(response.json()).toMatchSnapshot()
    expect(response.json().result).toEqual(MarketStatus.OPEN)
  })
})
