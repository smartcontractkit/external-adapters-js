import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockAptosViewCalls,
  VAULT_ID_CUSTOM_DECIMALS,
  VAULT_ID_HAPPY,
  VAULT_ID_NAV_ZERO,
  VAULT_ID_SHARES_ZERO,
} from './fixtures'

describe('Decibel Vault Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const mockRpcUrl = 'http://fake-aptos-rpc'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.APTOS_RPC_URL = mockRpcUrl
    process.env.DECIBEL_VAULT_MODULE_ADDRESS =
      '0x50ead22afd6ffd9769e3b3d6e0e64a2a350d68e8b102c4e72e33d0b8cfdfdb06'
    process.env.BACKGROUND_EXECUTE_MS = '1000'

    const mockDate = new Date('2024-01-01T00:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockAptosViewCalls(mockRpcUrl)

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

  describe('share-price endpoint', () => {
    it('should return the correct share price for default decimals (18)', async () => {
      const data = {
        vault_object_id: VAULT_ID_HAPPY,
        endpoint: 'share-price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return the correct share price with custom output_decimals', async () => {
      const data = {
        vault_object_id: VAULT_ID_CUSTOM_DECIMALS,
        output_decimals: 8,
        endpoint: 'share-price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return share_price = 0 when vault NAV is zero', async () => {
      const data = {
        vault_object_id: VAULT_ID_NAV_ZERO,
        endpoint: 'share-price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when vault total shares is zero', async () => {
      const data = {
        vault_object_id: VAULT_ID_SHARES_ZERO,
        endpoint: 'share-price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when vault_object_id is missing', async () => {
      const data = {
        endpoint: 'share-price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
