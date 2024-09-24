import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.API_ENDPOINT = 'https://api-endpoint-placeholder.com'
    process.env.BISCUIT_ATTESTATIONS = 'fake-biscuit-attestations'
    process.env.BISCUIT_BLOCKCHAINS = 'fake-biscuit-blockchains'
    process.env.CHAIN_ID = 'fake-chain-id'
    process.env.ASSET_CONTRACT_ADDRESS = 'fake-asset-contract-address'
    process.env.TOKEN_CONTRACT_ADDRESS = 'fake-token-contract-address'
    process.env.NAMESPACE = 'fake-namespace'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

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

  describe('total_reserve endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'total_reserve',
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
      const result = response.json()
      expect(result.data).toEqual({ total_reserve: 300000000 })
      expect(result.result).toBe(300000000)
    })
  })
})
