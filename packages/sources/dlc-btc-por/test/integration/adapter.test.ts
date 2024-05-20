import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockBitcoinRPCResponseSuccess, mockContractCallResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8545'
    process.env.CHAIN_ID = process.env.CHAIN_ID ?? '11155111'
    process.env.DLC_CONTRACT =
      process.env.DLC_CONTRACT ?? '0x334d9890b339a1b2e0f592f26b5374e22afdfbdf'
    process.env.BITCOIN_NETWORK = process.env.BITCOIN_NETWORK ?? 'regtest'
    process.env.BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL ?? 'http://localhost:8554'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '100'
    process.env.RETRY = process.env.RETRY ?? '0'
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

  describe('por endpoint', () => {
    it('should return success', async () => {
      mockContractCallResponseSuccess()
      mockBitcoinRPCResponseSuccess()
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
