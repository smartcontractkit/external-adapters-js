import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockContractCallResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? 'http://localhost:8545'
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
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'function symbol() view returns (string)',
      }
      mockContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success 2', async () => {
      const data = {
        contract: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        function: 'function latestAnswer() external view returns (int256)',
      }
      mockContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with parameters', async () => {
      const data = {
        contract: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
        function: 'function getAnswer(uint256 roundId) external view returns (int256)',
        inputParams: ['110680464442257317364'],
      }
      mockContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid input', async () => {
      const data = {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'symbol() view returns (string)', // missing 'function' keyword
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
