import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { JsonRpcProvider } from 'ethers'
import { PublicKey } from '@solana/web3.js'
import * as nock from 'nock'

jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  PublicKey: function (): PublicKey {
    return {} as PublicKey
  },
  Connection: class {
    getParsedTokenAccountsByOwner() {
      return {
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    mint: '1',
                    owner: '2',
                    tokenAmount: {
                      amount: 100,
                      decimals: 0,
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
      JsonRpcProvider: function (): JsonRpcProvider {
        return {} as JsonRpcProvider
      },
      Contract: function (address: string) {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return 8
          }),
          latestAnswer: jest.fn().mockImplementation(() => {
            return address == 'jlp' ? 200000000n : 1000000000n
          }),
        }
      },
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://arbi'
    process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? 'http://arbi'
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

  describe('solvJlp endpoint', () => {
    it('return success', async () => {
      const data = {
        endpoint: 'solvJlp',
        addresses: [
          {
            token: 'JLP',
            contractAddress: '1',
            wallets: ['2'],
          },
        ],
        jlpUsdContract: 'jlp',
        btcUsdContract: 'btc',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
