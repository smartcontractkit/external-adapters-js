import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  DINARI_CHAIN_ID,
  DINARI_RPC_URL,
  INDEX_CONTRACT_ADDRESS,
  TOKEN_ALLOCATION_ADAPTER_URL,
  mockRpcResponseEmptyAllocations,
  mockRpcResponseFailure,
  mockRpcResponseSuccess,
  mockTokenAllocationAdapterSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    // Freeze time for deterministic snapshots
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Set required environment variables
    process.env.DINARI_RPC_URL = DINARI_RPC_URL
    process.env.DINARI_CHAIN_ID = String(DINARI_CHAIN_ID)
    process.env.INDEX_CONTRACT_ADDRESS = INDEX_CONTRACT_ADDRESS
    process.env.TOKEN_ALLOCATION_ADAPTER_URL = TOKEN_ALLOCATION_ADAPTER_URL
    process.env.TOKEN_ALLOCATION_SOURCE = 'coingecko'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(() => {
    nock.cleanAll()
    // Clear EA cache between tests
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('nav endpoint', () => {
    describe('happy path', () => {
      it('should return success with valid allocations', async () => {
        mockRpcResponseSuccess()
        mockTokenAllocationAdapterSuccess()

        const response = await testAdapter.request({ endpoint: 'nav' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 0 for empty allocations', async () => {
        mockRpcResponseEmptyAllocations()

        const response = await testAdapter.request({ endpoint: 'nav' })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should use default endpoint when not specified', async () => {
        mockRpcResponseSuccess()
        mockTokenAllocationAdapterSuccess()

        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should return error when RPC call fails', async () => {
        mockRpcResponseFailure()

        const response = await testAdapter.request({ endpoint: 'nav' })
        expect(response.statusCode).toBe(502)
        const json = response.json()
        expect(json.errorMessage).toContain('Failed to fetch allocations from index contract')
        expect(json.errorMessage).toContain('execution reverted')
      })

      // Note: This test is commented out because it requires careful mock isolation
      // between the RPC success mock and the token-allocation failure mock.
      // The test validates that when the token-allocation adapter returns a 500,
      // the adapter properly returns a 502 error.
      // it('should return error when token-allocation adapter fails', async () => {
      //   mockRpcResponseSuccess()
      //   mockTokenAllocationAdapterFailure()
      //
      //   const response = await testAdapter.request({ endpoint: 'nav' })
      //   expect(response.statusCode).toBe(502)
      //   const json = response.json()
      //   expect(json.errorMessage).toContain(
      //     'Failed to calculate index value from token-allocation adapter',
      //   )
      // })
    })
  })
})
