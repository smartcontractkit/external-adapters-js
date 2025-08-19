import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockBaseContractCallResponseSuccess,
  mockBaseContractCallSolanaResponseSuccess,
} from './fixtures-api'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8080'
    process.env.BASE_RPC_URL = process.env.BASE_RPC_URL ?? 'http://localhost-base:8080'
    process.env.BASE_RPC_CHAIN_ID = process.env.BASE_RPC_CHAIN_ID ?? '56'
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

  describe('openedenAddress endpoint tbill type', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'openedenAddress',
        contractAddress: '0x440139321A15d14ce0729E004e91D66BaF1A08B0',
        contractAddressNetwork: 'BASE',
        type: 'tbill',
        abiName: 'evm',
      }

      mockBaseContractCallResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('openedenAddress endpoint other type', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'openedenAddress',
        contractAddress: '0x440139321A15d14ce0729E004e91D66BaF1A08B0',
        contractAddressNetwork: 'BASE',
        type: 'other',
        abiName: 'evm',
      }

      mockBaseContractCallResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('openedenAddress abiName solana', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'openedenAddress',
        contractAddress: '0xbEeE5862649eF24c1F1d5e799505F67F1e7bAB9a',
        contractAddressNetwork: 'BASE',
        abiName: 'solana',
      }

      mockBaseContractCallSolanaResponseSuccess()

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
