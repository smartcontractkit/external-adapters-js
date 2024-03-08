import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockETHGoerliContractCallResponseSuccess,
  mockETHMainnetContractCallResponseSuccess,
} from './fixtures'
import * as process from 'process'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_MAINNET_RPC_URL =
      process.env.ETHEREUM_MAINNET_RPC_URL ?? 'http://localhost:8545'
    process.env.ETHEREUM_MAINNET_CHAIN_ID = process.env.ETHEREUM_MAINNET_CHAIN_ID ?? '1'
    process.env.ETHEREUM_GOERLI_RPC_URL =
      process.env.ETHEREUM_GOERLI_RPC_URL ?? 'http://localhost:8554'
    process.env.ETHEREUM_GOERLI_CHAIN_ID = process.env.ETHEREUM_GOERLI_CHAIN_ID ?? '5'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
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

  describe('function endpoint', () => {
    it('should return success', async () => {
      const data = {
        contract: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        function: 'function latestAnswer() external view returns (int256)',
        network: 'ethereum_mainnet',
      }
      mockETHMainnetContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for different network', async () => {
      const data = {
        contract: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
        function: 'function latestAnswer() external view returns (int256)',
        network: 'ETHEREUM_GOERLI',
      }
      mockETHGoerliContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with parameters', async () => {
      const data = {
        contract: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        function: 'function getAnswer(uint256 roundId) external view returns (int256)',
        inputParams: ['110680464442257317364'],
        network: 'ethereum_mainnet',
      }
      mockETHMainnetContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for missing RPC url env var', async () => {
      const data = {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'function getAnswer(uint256 roundId) external view returns (int256)',
        network: 'arbitrum_mainnet', // ARBITRUM_MAINNET_RPC_URL is not provided
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
    })

    it('should return error for missing chain id env var', async () => {
      process.env.ARBITRUM_MAINNET_RPC_URL = 'http://localhost:8546'
      const data = {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'function getAnswer(uint256 roundId) external view returns (int256)',
        network: 'arbitrum_mainnet', // ARBITRUM_MAINNET_CHAIN_ID is not provided
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
    })

    it('should return error for invalid input', async () => {
      const data = {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'symbol() view returns (string)', // missing 'function' keyword
        network: 'ethereum_mainnet',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
