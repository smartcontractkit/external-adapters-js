import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { PublicKey } from '@solana/web3.js'
import { JsonRpcProvider } from 'ethers'
import * as nock from 'nock'

const token = 'tbill'
const mintAddress = '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6'
const ownerAddress = 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG'
const priceOracleAddress = '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40'
const balanceDecimals = 6
const tokenPriceDecimals = 8
const mockTokenPriceValue = BigInt(1.5 * 10 ** tokenPriceDecimals)

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
                    mint: mintAddress,
                    owner: ownerAddress,
                    tokenAmount: {
                      amount: String(1e9),
                      decimals: balanceDecimals,
                    },
                  },
                },
              },
            },
          },
        ],
      }
    }
  },
}))

jest.mock('ethers', () => {
  return {
    ethers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({} as JsonRpcProvider)),
      Contract: jest.fn().mockImplementation(() => ({
        decimals: jest.fn().mockResolvedValue(tokenPriceDecimals),
        latestAnswer: jest.fn().mockResolvedValue(mockTokenPriceValue),
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

  describe('SolanaTransport endpoint', () => {
    it('returns success', async () => {
      const data = {
        endpoint: 'solana',
        addresses: [
          {
            address: ownerAddress,
          },
        ],
        tokenMint: {
          token: token,
          contractAddress: mintAddress,
        },
        priceOracle: {
          contractAddress: priceOracleAddress,
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
