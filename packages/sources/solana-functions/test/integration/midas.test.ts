import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as midasFeedStateAccountData from '../fixtures/midas-feed-state-data-2026-07-21.json'
import * as midasManualFeedStateAccountData from '../fixtures/midas-manual-feed-state-data-2026-07-21.json'

const midasFeedStateAddress = '7UVwLrMTEDVvzQRaitJi7YLJcxFY8RTmXrHvSPMjTGDm'
const midasManualFeedStateAddress = 'HHwwM9t8eEeNDnGpXQnkHth2xHHxkD531qqBqz5H7meX'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    async send() {
      switch (address) {
        case midasFeedStateAddress:
          return midasFeedStateAccountData.result
        case midasManualFeedStateAddress:
          return midasManualFeedStateAccountData.result
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

  describe('midas', () => {
    it('should return success response', async () => {
      const data = {
        endpoint: 'midas',
        feedStateAddress: midasFeedStateAddress,
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
