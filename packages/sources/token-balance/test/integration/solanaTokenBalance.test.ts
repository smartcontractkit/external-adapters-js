import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { PublicKey } from '@solana/web3.js'
import { JsonRpcProvider } from 'ethers'
import * as nock from 'nock'

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  PublicKey: function (): PublicKey {
    return {} as PublicKey
  },
  Connection: class {
    async getParsedTokenAccountsByOwner() {
      return {
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    mint: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
                    owner: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG',
                    tokenAmount: {
                      amount: '1000000000', // 1e9
                      decimals: 6,
                    },
                  },
                },
              },
            },
          },
        ],
      }
    }
    async getBalance() {
      return 0
    }
    async getParsedAccountInfo() {
      return {
        context: { slot: 1 },
        value: {
          data: {
            parsed: {
              info: {
                mint: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
                tokenAmount: {
                  amount: '1000000000',
                  decimals: 6,
                },
              },
            },
          },
        },
      }
    }
  },
}))

jest.mock('ethers', () => {
  return {
    ethers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({} as JsonRpcProvider)),
      Contract: jest.fn().mockImplementation(() => ({
        decimals: jest.fn().mockResolvedValue(8),
        latestAnswer: jest.fn().mockResolvedValue(150000000n), // 1.5 USD
        latestRoundData: jest.fn().mockResolvedValue({
          answer: 150000000n,
          startedAt: 1,
          updatedAt: 1,
          answeredInRound: 1,
        }),
      })),
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? 'http://mock-solana'
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? 'http://mock-eth'
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

  describe('SolanaTokenBalanceTransport endpoint', () => {
    it('returns success', async () => {
      const data = {
        endpoint: 'solanaTokenBalance',
        addresses: [
          {
            address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG',
            network: 'SOLANA',
            chainId: '0',
          },
        ],
        tokenMint: {
          token: 'TBILL',
          contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
        },
        priceOracle: {
          contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
          chainId: '1',
          network: 'ETHEREUM',
        },
      }

      const response = await testAdapter.request(data)
      console.log('DEBUG response:', response.json()) // helpful if it fails

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
