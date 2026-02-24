import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  MOCK_ROUND_VALUE_DECIMAL,
  MOCK_ROUND_VALUE_HEX,
  mockEthereumRpcContractError,
  mockEthereumRpcContractErrorSingle,
  mockEthereumRpcFailure,
  mockEthereumRpcSingleRequest,
  mockEthereumRpcSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? 'http://localhost:8545'
    process.env.ETHEREUM_CHAIN_ID = process.env.ETHEREUM_CHAIN_ID ?? '1'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterEach(() => {
    nock.cleanAll()

    // Clear the EA cache between tests
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

  describe('round endpoint', () => {
    describe('happy path', () => {
      it('should return success for round endpoint', async () => {
        const data = { endpoint: 'round' }
        mockEthereumRpcSuccess(MOCK_ROUND_VALUE_HEX)
        mockEthereumRpcSingleRequest(MOCK_ROUND_VALUE_HEX)

        // First call triggers background execution
        await testAdapter.request(data)
        // Second call retrieves cached result
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        expect(json.data.result).toBe(MOCK_ROUND_VALUE_DECIMAL)
        expect(json.result).toBe(MOCK_ROUND_VALUE_DECIMAL)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for default endpoint (no endpoint specified)', async () => {
        const data = {}
        mockEthereumRpcSuccess(MOCK_ROUND_VALUE_HEX)
        mockEthereumRpcSingleRequest(MOCK_ROUND_VALUE_HEX)

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        expect(json.data.result).toBe(MOCK_ROUND_VALUE_DECIMAL)
        expect(json.result).toBe(MOCK_ROUND_VALUE_DECIMAL)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle RPC endpoint failure with 502', async () => {
        const data = { endpoint: 'round' }
        mockEthereumRpcFailure()

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle contract execution revert', async () => {
        const data = { endpoint: 'round' }
        mockEthereumRpcContractError()
        mockEthereumRpcContractErrorSingle()

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
