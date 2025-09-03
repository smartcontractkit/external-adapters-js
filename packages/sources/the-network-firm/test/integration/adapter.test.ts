import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBackedResponseSuccess,
  mockEmgemxResponseSuccess,
  mockEurrResponseSuccess,
  mockGiftResponseSuccess,
  mockMCO2Response,
  mockSTBTResponseSuccess,
  mockUraniumResponseSuccess,
  mockUSDRResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.ALT_API_ENDPOINT = 'http://test-endpoint-new'
    process.env.EMGEMX_API_KEY = 'api-key'
    process.env.URANIUM_API_KEY = 'api-key'
    process.env.ACME_API_KEY = 'acme-api-key'
    process.env.URANIUM_DIGITAL_QOHMMJQAF4JK_API_KEY = 'uranium-api-key'
    process.env.EMGEMX_TDFKF3_API_KEY = 'emgemx-api-key'
    process.env.M0_STABLECOIN_INPD83_API_KEY = 'm0-api-key'
    process.env.RE_PROTOCOL_8TAWLM_API_KEY = 're-api-key'

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(() => {
    nock.cleanAll()
    // clear EA cache
    const keys = testAdapter.mockCache?.cache.keys()
    if (!keys) {
      throw new Error('unexpected failure 1')
    }
    for (const key of keys) {
      testAdapter.mockCache?.delete(key)
    }
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('mco2 endpoint', () => {
    it('should return success', async () => {
      mockMCO2Response()
      const response = await testAdapter.request()
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('stbt endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'stbt',
      }
      mockSTBTResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('backed endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'backed',
        accountName: 'IBTA',
      }
      mockBackedResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('account name not found should return error', async () => {
      const data = {
        endpoint: 'backed',
        accountName: 'QQQ',
      }
      mockBackedResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('usdr endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'usdr',
      }
      mockUSDRResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('eurr endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'eurr',
      }
      mockEurrResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('gift endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'gift',
      }
      mockGiftResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('emgemx endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'emgemx',
      }
      mockEmgemxResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('uranium endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'uranium',
      }
      mockUraniumResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
