import { mockRateResponseSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute', () => {
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

  describe('trades endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'ETH',
        quote: 'USD',
      }
      mockRateResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('realized-vol endpoint', () => {
    it('default should return success', async () => {
      const data = {
        base: 'BTC',
        quote: 'USD',
        endpoint: 'realized-vol',
      }
      mockRateResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
  it('should return 400 error with bad resultPath input', async () => {
    const data = {
      base: 'BTC',
      quote: 'USD',
      endpoint: 'realized-vol',
      resultPath: 'INVALID',
    }
    mockRateResponseSuccess()
    const response = await testAdapter.request(data)
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })
})
