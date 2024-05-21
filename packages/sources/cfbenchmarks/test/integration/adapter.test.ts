import { mockBircResponseSuccess, mockResponseSuccess } from './fixtures'
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
    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'
    process.env['WS_ENABLED'] = 'false'
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  describe('birc endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'birc',
        tenor: 'SIRB',
      }
      mockBircResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('crypto endpoint', () => {
    it('should return success', async () => {
      const data = {
        index: 'BRTI',
        transport: 'rest',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('with override should return success', async () => {
      const data = {
        base: 'XXX',
        quote: 'XXX',
        transport: 'rest',
        overrides: {
          cfbenchmarks: {
            XXX: 'BRTI',
          },
        },
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
