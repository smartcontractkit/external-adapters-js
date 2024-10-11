import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockBitcoinRPCResponseSuccess } from './fixtures'
import { ethers } from 'ethers'

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
          return {} as ethers.providers.JsonRpcProvider
        },
      },
      Contract: function () {
        return {
          attestorGroupPubKey: jest.fn().mockImplementation(() => {
            return 'xpub6C1F2SwADP3TNajQjg2PaniEGpZLvWdMiFP8ChPjQBRWD1XUBeMdE4YkQYvnNhAYGoZKfcQbsRCefserB5DyJM7R9VR6ce6vLrXHVfeqyH3'
          }),
          getAllDLCs: jest.fn().mockImplementation(() => {
            return [
              {
                uuid: '0x9399fc7c386e7357fc101e638f3e208dcb95fbe06c47e3ff4219d5c726635222',
                protocolContract: '0x2940FcBb3C32901Df405da0E96fd97D1E2a53f34',
                timestamp: 0x665f1dd7,
                valueLocked: 0x01312d00,
                creator: '0x0DD4f29E21F10cb2E485cf9bDAb9F2dD1f240Bfa',
                status: 1,
                fundingTxId: '2d64eefe48cd209c4d549b065d3c04dcb29af57b01ca2a98c24274eae2732029',
                closingTxId: '',
                btcFeeRecipient:
                  '021b34f36d8487ce3a7a6f0124f58854d561cb52077593d1e86973fac0fea1a8b1',
                btcMintFeeBasisPoints: 0x64,
                btcRedeemFeeBasisPoints: 0x64,
                taprootPubKey: 'b362931e3e4cf3cc20f75ae11ff5a4c115ec1548cb5f2c7c48294929f1e8979c',
              },
            ]
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

    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'http://localhost:8545'
    process.env.ARBITRUM_CHAIN_ID = process.env.ARBITRUM_CHAIN_ID ?? '11155111'
    process.env.BITCOIN_NETWORK = process.env.BITCOIN_NETWORK ?? 'mainnet'
    process.env.BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL ?? 'http://localhost:8554'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '100'
    process.env.RETRY = process.env.RETRY ?? '0'

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

  describe('por endpoint', () => {
    it('should return success', async () => {
      mockBitcoinRPCResponseSuccess()
      const response = await testAdapter.request({
        network: 'arbitrum',
        dlcContract: '0x334d9890b339a1b2e0f592f26b5374e22afdfbdf',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
