import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockETHContractCallResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_RPC_URL =
      process.env.ETHEREUM_RPC_URL ?? 'http://localhost-eth-mainnet:8080'
    process.env.ETHEREUM_RPC_CHAIN_ID = process.env.ETHEREUM_RPC_CHAIN_ID ?? '1'
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

  describe('tbill endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'tbill',
        addresses: [
          {
            contractAddress: '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a',
            chainId: '1',
            token: 'TBILL',
            wallets: ['0x5EaFF7af80488033Bc845709806D5Fae5291eB88'],
            priceOracleAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
          },
        ],
      }
      mockETHContractCallResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
