import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as jitoStakePoolAccountData from '../fixtures/jito-stake-pool-account-data-2026-04-29.json'

const jitoStakePoolAccountAddress = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (_address: string) => ({
    async send() {
      return jitoStakePoolAccountData.result
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

  describe('pool-token-rate', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'pool-token-rate',
        stakePoolAccountAddress: jitoStakePoolAccountAddress,
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
