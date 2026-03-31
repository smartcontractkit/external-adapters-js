import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinitionFromConfig<typeof config>>
  let oldEnv: NodeJS.ProcessEnv

  const requests = [
    { symbol: '100', endpoint: 'hk-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'cn-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'indices-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'kr-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'jp-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'tw-depth', transport: 'rest' },
    { symbol: '100', endpoint: 'hk-quote', transport: 'rest' },
    { symbol: '100', endpoint: 'cn-quote', transport: 'rest' },
    { symbol: '100', endpoint: 'indices-quote', transport: 'rest' },
    { symbol: '100', endpoint: 'kr-quote', transport: 'rest' },
    { symbol: '100', endpoint: 'jp-quote', transport: 'rest' },
    { symbol: '100', endpoint: 'tw-quote', transport: 'rest' },
  ]

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.API_ENDPOINT = 'http://localhost:9090'
    process.env['API_KEY_HK'] = 'fake-api-key'
    process.env['API_KEY_CN'] = 'fake-api-key'
    process.env['API_KEY_GB'] = 'fake-api-key'
    process.env['API_KEY_KR'] = 'fake-api-key'
    process.env['API_KEY_JP'] = 'fake-api-key'
    process.env['API_KEY_TW'] = 'fake-api-key'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
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

  describe('rest endpoints', () => {
    it('should return success', async () => {
      mockResponseSuccess()
      await Promise.all(requests.map((req) => testAdapter.request(req)))
      await new Promise((resolve) => setTimeout(resolve, 1000))
      for (const request of requests) {
        const response = await testAdapter.request(request)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      }
    }, 30_000)
  })
})
