import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as sanctumInfinityPoolAccountData from '../fixtures/sanctum-infinity-pool-account-data-2025-10-07.json'
import * as sanctumInfinityTokenAccountData from '../fixtures/sanctum-infinity-token-account-data-2025-10-07.json'

const poolStateAddress = 'AYhux5gJzCoeoc1PoJ1VxwPDe22RwcvpHviLDD1oCGvW'
const infinityTokenMintAddress = '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm'

const solanaRpc = makeStub('solanaRpc', {
  getAccountInfo: (address: string) => ({
    async send() {
      if (address === poolStateAddress) return sanctumInfinityPoolAccountData.result
      if (address === infinityTokenMintAddress) return sanctumInfinityTokenAccountData.result
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

  describe('sanctum-infinity', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'sanctum-infinity',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
