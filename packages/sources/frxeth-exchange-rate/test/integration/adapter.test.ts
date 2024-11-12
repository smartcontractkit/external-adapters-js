import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockRpc } from './fixtures'

describe('frxETH - ETH exchange rate', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const mockRpcUrl = 'http://localhost:8545'

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = mockRpcUrl
    process.env.CHAIN_ID = '1'
    process.env.FRAX_ETH_PRICE_CONTRACT = '0xb12c19c838499e3447afd9e59274b1be56b1546a'
    process.env.BACKGROUND_EXECUTE_MS = '1000'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    mockRpc(mockRpcUrl)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('crypto endpoint', () => {
    it('should return success for priceType: HIGH', async () => {
      const data = {
        priceType: 'high',
        endpoint: 'crypto',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for priceType: LOW', async () => {
      const data = {
        priceType: 'low',
        endpoint: 'crypto',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for missing priceType', async () => {
      const data = {
        endpoint: 'crypto',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid priceType', async () => {
      const data = {
        priceType: 'invalid',
        endpoint: 'crypto',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
