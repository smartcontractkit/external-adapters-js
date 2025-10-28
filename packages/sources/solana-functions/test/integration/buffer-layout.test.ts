import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as usdcMinterAccountData from '../fixtures/usdc-minter-account-data-2025-10-27.json'

const usdcMinterAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    async send() {
      switch (address) {
        case usdcMinterAddress:
          return usdcMinterAccountData.result
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

  describe('buffer-layout', () => {
    it('should return success USDC supply', async () => {
      const data = {
        endpoint: 'buffer-layout',
        stateAccountAddress: usdcMinterAddress,
        field: 'supply',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
