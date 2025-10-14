import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { JsonRpcProvider } from 'ethers'
import * as nock from 'nock'
import { mockWalletAssetResponseSuccess, mockWalletListResponseSuccess } from './fixtures'

jest.mock('crypto', () => {
  const actualModule = jest.requireActual('crypto')
  return {
    ...actualModule,
    createPrivateKey: jest.fn(() => ({ mocked: 'key' })),
    createSign: jest.fn(() => {
      return {
        write: jest.fn(),
        end: jest.fn(),
        sign: jest.fn(() => 'mocked-signature'),
      }
    }),
  }
})

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ethers: {
      JsonRpcProvider: function (): JsonRpcProvider {
        return {} as JsonRpcProvider
      },
      Contract: function () {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return 8
          }),
          latestAnswer: jest.fn().mockImplementation(() => {
            return 5000000000n
          }),
        }
      },
    },
    parseUnits: actualModule.parseUnits,
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'TODO'
    process.env.PRIVATE_KEY = 'TODO'
    process.env.API_PROXY = 'TODO'
    process.env.ARBITRUM_RPC_URL = 'fake-arbi-url'
    process.env.WALLET_C1_API_KEY = 'fake-api-key'
    process.env.WALLET_C1_PRIVATE_KEY = 'fake-private-key'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
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

  describe('wallet endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'wallet',
        client: 'c1',
        decimals: 18,
      }
      mockWalletListResponseSuccess()
      mockWalletAssetResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
