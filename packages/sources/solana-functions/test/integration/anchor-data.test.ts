import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as fragmetricAccountData from '../fixtures/fragmetric-account-data-2025-10-06.json'

const getAccountInfoRequest = makeStub('getAccountInfoRequest', {
  send: jest.fn(),
})

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: () => getAccountInfoRequest,
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
      const accountData = makeStub('accountData', fragmetricAccountData)
      getAccountInfoRequest.send.mockResolvedValueOnce(accountData.result)
      const data = {
        endpoint: 'anchor-data',
        stateAccountAddress: '3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb',
        account: 'FundAccount',
        field: 'one_receipt_token_as_sol',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
