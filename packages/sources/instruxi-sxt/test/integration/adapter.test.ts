import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess, mockResponseError } from './fixtures'
import { endpoint } from '../../src/endpoint/total_reserve'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = process.env.API_ENDPOINT ?? 'https://api-endpoint-placeholder.com'
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
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

  describe('total_reserve endpoint', () => {
    it('should return success', async () => {
      const data = {
        data: {
          endpoint: 'total_reserve',
          BISCUIT_ATTESTATIONS: 'example_biscuit_attestations_token',
          BISCUIT_BLOCKCHAINS: 'example_biscuit_blockchains_token',
          CHAIN_ID: 'example_chainId',
          ASSET_CONTRACT_ADDRESS: 'example contract address',
          TOKEN_CONTRACT_ADDRESS: 'example token contract address',
          NAMESPACE: 'example_namespace',
        },
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error for invalid CHAIN_ID', async () => {
      const data = {
        data: {
          endpoint: 'total_reserve',
          BISCUIT_ATTESTATIONS: 'example_biscuit_attestations_token',
          BISCUIT_BLOCKCHAINS: 'example_biscuit_blockchains_token',
          CHAIN_ID: 'invalid_chain_id',
          ASSET_CONTRACT_ADDRESS: 'example contract address',
          TOKEN_CONTRACT_ADDRESS: 'example token contract address',
          NAMESPACE: 'example_namespace',
        },
      }
      mockResponseError()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
