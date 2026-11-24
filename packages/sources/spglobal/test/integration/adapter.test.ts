import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { config } from '../../src/config'
import { mockSecurities, mockToken } from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'http://fake-api-url'
    process.env.API_KEY = 'fake-api-key'
    process.env.AUTH_API_ENDPOINT = 'http://fake-auth-api-url'
    process.env.AUTH_API_KEY = 'fake-auth-api-key'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockToken()
    mockSecurities()

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

  describe('ssa endpoint', () => {
    it('should return success', async () => {
      const data = {
        security_id: 'AAPL',
        endpoint: 'ssa',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid ssa', async () => {
      const data = {
        security_id: 'INVALIDSSA',
        endpoint: 'ssa',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid time', async () => {
      const data = {
        security_id: 'INVALIDTIME',
        endpoint: 'ssa',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
