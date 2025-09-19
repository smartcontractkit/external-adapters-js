import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { PublicKey } from '@solana/web3.js'
import * as nock from 'nock'

const accountBalance = 123_000_000_000
const ownerAddress = 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG'

jest.mock('@solana/web3.js', () => ({
  PublicKey: function (): PublicKey {
    return {} as PublicKey
  },
  Connection: class {
    async getAccountInfo() {
      return {
        lamports: accountBalance,
      }
    }
  },
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? 'http://mock-solana'
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

  describe('SolanaBalanceTransport endpoint', () => {
    it('returns success', async () => {
      const data = {
        endpoint: 'solana-balance',
        addresses: [
          {
            address: ownerAddress,
          },
        ],
      }

      const response = await testAdapter.request(data)
      console.log('DEBUG response:', response.json()) // helpful if it fails

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
