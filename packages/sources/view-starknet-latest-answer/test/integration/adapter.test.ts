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
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('function endpoint good config', () => {
    beforeAll(async () => {
      const adapter = (await import('./../../src')).adapter
      testAdapter = await TestAdapter.startWithMockedCache(adapter, {
        testAdapter: {} as TestAdapter<never>,
      })
    })
    afterAll(async () => {
      await testAdapter.api.close()
    })
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
  })

  describe('function endpoint bad config', () => {
    beforeAll(async () => {
      delete process.env.STARKNET_RPC_URL

      const adapter = (await import('./../../src')).adapter
      testAdapter = await TestAdapter.startWithMockedCache(adapter, {
        testAdapter: {} as TestAdapter<never>,
      })
    })
    afterAll(async () => {
      await testAdapter.api.close()
    })
    it('should return error for missing RPC url env var', async () => {
      const data = {
        contract: '0x0228128e84cdfc51003505dd5733729e57f7d1f7e54da679474e73db4ecaad44',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
    })
  })
})
