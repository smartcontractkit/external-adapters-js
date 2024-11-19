import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBASEMainnetContractCallResponseSuccess,
  mockETHMainnetContractCallResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ETHEREUM_RPC_URL =
      process.env.ETHEREUM_RPC_URL ?? 'http://localhost-eth-mainnet:8080'
    process.env.ETHEREUM_RPC_CHAIN_ID = process.env.ETHEREUM_RPC_CHAIN_ID ?? '1'
    process.env.BASE_RPC_URL = process.env.BASE_RPC_URL ?? 'http://localhost-base-mainnet:8080'
    process.env.BASE_RPC_CHAIN_ID = process.env.BASE_RPC_CHAIN_ID ?? '8453'
    process.env.BACKGROUND_EXECUTE_MS = '0'

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

  describe('evm endpoint', () => {
    it('missing address network and chainId should fail 400', async () => {
      const data = {
        endpoint: 'evm',
        addresses: [
          {
            contractAddress: '0xC96dE26018A54D51c097160568752c4E3BD6C364',
            wallets: ['0x3A29CD3052774224E7C2CF001254211C986967B2'],
          },
        ],
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('missing env var network RPC should fail 400', async () => {
      const data = {
        endpoint: 'evm',
        addresses: [
          {
            network: 'bad-network',
            contractAddress: '0xC96dE26018A54D51c097160568752c4E3BD6C364',
            wallets: ['0x3A29CD3052774224E7C2CF001254211C986967B2'],
          },
        ],
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with network', async () => {
      const data = {
        endpoint: 'evm',
        addresses: [
          {
            network: 'ethereum',
            contractAddress: '0xC96dE26018A54D51c097160568752c4E3BD6C364',
            wallets: [
              '0x3A29CD3052774224E7C2CF001254211C986967B2',
              '0x3d9bCcA8Bc7D438a4c5171435f41a0AF5d5E6083',
            ],
          },
          {
            network: 'base',
            contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            wallets: ['0x1fCca65fb6Ae3b2758b9b2B394CB227eAE404e1E'],
          },
        ],
      }
      mockETHMainnetContractCallResponseSuccess()
      mockBASEMainnetContractCallResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success with chainId', async () => {
      const data = {
        endpoint: 'evm',
        addresses: [
          {
            chainId: '8453',
            contractAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
            wallets: ['0x1fCca65fb6Ae3b2758b9b2B394CB227eAE404e1E'],
          },
        ],
      }
      mockETHMainnetContractCallResponseSuccess()
      mockBASEMainnetContractCallResponseSuccess()

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
