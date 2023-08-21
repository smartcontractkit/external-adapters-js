import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['BITCOIN_MAINNET_POR_INDEXER_URL'] =
      process.env['BITCOIN_MAINNET_POR_INDEXER_URL'] ?? 'http://localhost:8545'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
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

  describe('balance endpoint', () => {
    it('should return success', async () => {
      const data = {
        addresses: [
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
          {
            network: 'bitcoin',
            chainId: 'mainnet',
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
          },
        ],
        minConfirmations: 6,
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure for missing env', async () => {
      const data = {
        addresses: [
          {
            network: 'dogecoin',
            chainId: 'mainnet',
            address: '39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE',
          },
          {
            network: 'bitcoin',
            chainId: 'testnet',
            address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
          },
        ],
        minConfirmations: 6,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return failure for empty addresses', async () => {
      const data = {
        addresses: [],
        minConfirmations: 6,
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
