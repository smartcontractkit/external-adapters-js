import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockOkxResponseError, mockOkxResponseSuccess } from './fixtures-api'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8080'
    process.env.OKX_X_ASSET_API_URL = 'http://okx'
    process.env.BACKGROUND_EXECUTE_MS = '0'

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

  describe('okxAssetsAddress', () => {
    it('should return success for lockAddresses', async () => {
      mockOkxResponseSuccess()

      const response = await testAdapter.request({
        endpoint: 'okxAssetsAddress',
        coin: 'lock',
        network: 'bitcoin',
        chainId: 'mainnet',
        addressField: 'lockAddresses',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for stakingBalanceDetails', async () => {
      mockOkxResponseSuccess()

      const response = await testAdapter.request({
        endpoint: 'okxAssetsAddress',
        coin: 'stake',
        network: 'bitcoin',
        chainId: 'mainnet',
        addressField: 'stakingBalanceDetails',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when data source returns error', async () => {
      mockOkxResponseError('ERROR_COIN')

      const response = await testAdapter.request({
        endpoint: 'okxAssetsAddress',
        coin: 'ERROR_COIN',
        network: 'bitcoin',
        chainId: 'mainnet',
        addressField: 'stakingBalanceDetails',
      })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
