import * as nock from 'nock'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { mockStarknetSepoliaContractCallResponseSuccess } from './fixtures'
import * as process from 'process'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.BACKGROUND_EXECUTE_MS = '0'
    process.env.STARKNET_RPC_URL = 'http://localhost:8545'

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
        contract: '0x013584125fb2245fab8179e767f2c393f74f7370ddc2748aaa422f846cc760e4',
      }
      mockStarknetSepoliaContractCallResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
    it('should return error for invalid input', async () => {
      const data = {
        contract: '0x013584125fb2245fab8179e767f2c393f74f7370ddc2748aaa422f846cc76',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
    it("should return error for contract which isn't a chainlink feed", async () => {
      const data = {
        contract: '0x036031daa264c24520b11d93af622c848b2499b66b41d611bac95e13cfca131a',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
