import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'
import { JsonRpcProvider } from 'ethers'

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
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.PRIVATE_KEY = process.env.PRIVATE_KEY ?? 'fake-private-key'
    process.env.API_PROXY = 'http://localhost'
    process.env.ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL ?? 'fake-arbi-url'
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
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('solv endpoint', () => {
    it('should return success', async () => {
      const data = {
        addresses: [
          {
            address: '123',
          },
        ],
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
