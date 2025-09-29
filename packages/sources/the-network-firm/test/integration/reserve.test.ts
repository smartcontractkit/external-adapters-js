import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockM0ResponseSuccess,
  mockReResponseSuccess,
  mockReserveEmgemxResponseSuccess,
  mockReserveUraniumResponseSuccess,
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
    process.env.URANIUM_DIGITAL_QOHMMJQAF4JK_API_KEY = 'uranium-api-key'
    process.env.EMGEMX_TDFKF3_API_KEY = 'emgemx-api-key'
    process.env.M0_STABLECOIN_INPD83_API_KEY = 'm0-api-key'
    process.env.RE_PROTOCOL_8TAWLM_API_KEY = 're-api-key'

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

  describe('reserve endpoint', () => {
    it('should return success for uranium', async () => {
      const data = {
        endpoint: 'reserve',
        client: 'uranium-digital-qohmmjqaf4jk',
      }

      mockReserveUraniumResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for emgemx', async () => {
      const data = {
        endpoint: 'reserve',
        client: 'emgemx-tdfkf3',
      }

      mockReserveEmgemxResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for m0', async () => {
      const data = {
        endpoint: 'reserve',
        client: 'm0-stablecoin-inpd83',
      }

      mockM0ResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for re', async () => {
      const data = {
        endpoint: 'reserve',
        client: 're-protocol-8tawlm',
      }

      mockReResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail if client name is not present or wrong', async () => {
      const data = {
        endpoint: 'reserve',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
