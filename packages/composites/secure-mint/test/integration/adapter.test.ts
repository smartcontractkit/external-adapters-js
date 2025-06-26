import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockBitgoSuccess, mockIndexerSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.SECURE_MINT_INDEXER_URL = 'http://fake-indexer'
    process.env.BITGO_RESERVES_EA_URL = 'http://fake-bitgo'
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

  describe('mintable endpoint', () => {
    it('should return success', async () => {
      mockBitgoSuccess()
      mockIndexerSuccess()

      const data = {
        token: 'token1',
        reserves: 'Bitgo',
        supplyChains: ['1'],
        supplyChainBlocks: [0],
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should block overmint', async () => {
      mockBitgoSuccess()
      mockIndexerSuccess()

      const data = {
        token: 'token2',
        reserves: 'Bitgo',
        supplyChains: ['1'],
        supplyChainBlocks: [0],
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle error', async () => {
      mockBitgoSuccess()
      mockIndexerSuccess()

      const data = {
        token: 'token3',
        reserves: 'Bitgo',
        supplyChains: ['1'],
        supplyChainBlocks: [0],
      }
      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
