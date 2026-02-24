import { sleep } from '@chainlink/external-adapter-framework/util'
import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  JTRSY_USD_FEED_ADDRESS,
  mockCopperWalletsAllAssets,
  mockCopperWalletsApiError,
  mockCopperWalletsEmpty,
  mockCopperWalletsInvalidResponse,
  mockCopperWalletsNullResponse,
  mockCopperWalletsSuccess,
  mockCopperWalletsUnsupportedAssets,
  mockCopperWalletsWithUstb,
  mockEthereumRpc,
  mockSuperstateNavEmpty,
  mockSuperstateNavSuccess,
  OUSG_USD_FEED_ADDRESS,
  USYC_USD_FEED_ADDRESS,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.COPPER_API_KEY = process.env.COPPER_API_KEY ?? 'fake-api-key'
    process.env.COPPER_API_SECRET = process.env.COPPER_API_SECRET ?? 'fake-api-secret'
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? 'http://localhost:8545'
    process.env.ETHEREUM_CHAIN_ID = '1'
    process.env.API_ENDPOINT = 'https://api.copper.co/platform'
    process.env.SUPERSTATE_API_ENDPOINT = 'https://api.superstate.co'
    process.env.USTB_FUND_ID = '1'
    process.env.BACKGROUND_EXECUTE_MS = '100'

    // Required feed addresses without defaults
    process.env.USYC_USD_FEED_ADDRESS = USYC_USD_FEED_ADDRESS
    process.env.OUSG_USD_FEED_ADDRESS = OUSG_USD_FEED_ADDRESS
    process.env.JTRSY_USD_FEED_ADDRESS = JTRSY_USD_FEED_ADDRESS

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Set up default mocks before adapter starts
    mockCopperWalletsSuccess()
    mockEthereumRpc()
    mockSuperstateNavSuccess()

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

  describe('reserves endpoint', () => {
    describe('happy path', () => {
      it('should return success with basic wallets', async () => {
        // Clear cache and set up mocks atomically
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsSuccess()
        mockEthereumRpc()

        // First call triggers background execution
        await testAdapter.request({ endpoint: 'reserves' })
        // Wait for background execution to complete
        await sleep(200)
        // Second call retrieves cached result
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success with USTB wallet using Superstate NAV', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsWithUstb()
        mockEthereumRpc()
        mockSuperstateNavSuccess()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success with all supported assets', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsAllAssets()
        mockEthereumRpc()
        mockSuperstateNavSuccess()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return zero result with empty wallets', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsEmpty()
        mockEthereumRpc()
        mockSuperstateNavSuccess()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return zero result when all assets are unsupported', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsUnsupportedAssets()
        mockEthereumRpc()
        mockSuperstateNavSuccess()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should work without explicit endpoint parameter (default endpoint)', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsSuccess()
        mockEthereumRpc()

        await testAdapter.request({})
        await sleep(200)
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle Copper API error', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsApiError()
        mockEthereumRpc()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle Copper API invalid response', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsInvalidResponse()
        mockEthereumRpc()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle Copper API null response', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsNullResponse()
        mockEthereumRpc()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle Superstate NAV empty response for USTB', async () => {
        nock.cleanAll()
        const keys = testAdapter.mockCache?.cache.keys()
        if (keys) {
          for (const key of keys) {
            testAdapter.mockCache?.delete(key)
          }
        }

        mockCopperWalletsWithUstb()
        mockEthereumRpc()
        mockSuperstateNavEmpty()

        await testAdapter.request({ endpoint: 'reserves' })
        await sleep(200)
        const response = await testAdapter.request({ endpoint: 'reserves' })
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
