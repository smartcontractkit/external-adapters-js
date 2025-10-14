import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as adrenaAccountData from '../fixtures/adrena-account-data-2025-10-08.json'
import * as flashTradeAccountData from '../fixtures/flash-trade-account-data-2025-10-08.json'
import * as fragmetricAccountData from '../fixtures/fragmetric-account-data-2025-10-06.json'

const fragmetricStateAccountAddress = '3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb'
const adrenaStateAccountAddress = '4bQRutgDJs6vuh6ZcWaPVXiQaBzbHketjbCDjL4oRN34'
const flashTradeStateAccountAddress = 'HfF7GCcEc76xubFCHLLXRdYcgRzwjEPdfKWqzRS8Ncog'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    async send() {
      switch (address) {
        case fragmetricStateAccountAddress:
          return fragmetricAccountData.result
        case adrenaStateAccountAddress:
          return adrenaAccountData.result
        case flashTradeStateAccountAddress:
          return flashTradeAccountData.result
      }
      throw new Error(`Unexpected account address: ${address}`)
    },
  }),
})

const createSolanaRpc = () => solanaRpc

jest.mock('@solana/rpc', () => ({
  createSolanaRpc() {
    return createSolanaRpc()
  },
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = 'solana.rpc.url'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
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
    spy.mockRestore()
  })

  describe('anchor-data', () => {
    it('should return success fragmetric price', async () => {
      const data = {
        endpoint: 'anchor-data',
        stateAccountAddress: fragmetricStateAccountAddress,
        account: 'FundAccount',
        field: 'one_receipt_token_as_sol',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success adrena token price', async () => {
      const data = {
        endpoint: 'anchor-data',
        stateAccountAddress: adrenaStateAccountAddress,
        account: 'Pool',
        field: 'lp_token_price_usd',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success flash trade token price', async () => {
      const data = {
        endpoint: 'anchor-data',
        stateAccountAddress: flashTradeStateAccountAddress,
        account: 'Pool',
        field: 'compounding_lp_price',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
