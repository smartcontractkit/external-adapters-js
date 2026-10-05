import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'
import {
  mockForexResponseEmpty,
  mockForexResponseSuccess,
  mockIndicatorResponseEmpty,
  mockIndicatorResponseSuccess,
} from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'fake-api-key'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('forex endpoint', () => {
    it('should return success', async () => {
      mockForexResponseSuccess()
      const response = await testAdapter.request({
        base: 'USD',
        quote: 'JPY',
        endpoint: 'forex',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with the price alias and lowercase symbols', async () => {
      mockForexResponseSuccess()
      const response = await testAdapter.request({
        from: 'usd',
        to: 'jpy',
        endpoint: 'price',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when no rate is returned', async () => {
      mockForexResponseEmpty()
      const response = await testAdapter.request({
        base: 'USD',
        quote: 'BRL',
        endpoint: 'forex',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on missing input', async () => {
      const response = await testAdapter.request({
        base: 'USD',
        endpoint: 'forex',
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('indicator endpoint', () => {
    it('should return success', async () => {
      mockIndicatorResponseSuccess()
      const response = await testAdapter.request({
        currency: 'USD',
        indicator: 'inflation',
        endpoint: 'indicator',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when no value is returned', async () => {
      mockIndicatorResponseEmpty()
      const response = await testAdapter.request({
        currency: 'USD',
        indicator: 'gdp',
        endpoint: 'indicator',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error on missing input', async () => {
      const response = await testAdapter.request({
        currency: 'USD',
        endpoint: 'indicator',
      })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
