import { JsonRpcProvider } from 'ethers'
import { ChainProviders, chains } from '../../../src/lib/chains'
import { makeSettings } from '../fixtures/settings'

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  JsonRpcProvider: jest
    .fn()
    .mockImplementation((url: string, chainId: number) => ({ url, chainId })),
}))

const settings = makeSettings()

describe('chains', () => {
  it('reads each chain from its settings', () => {
    expect(chains.ethereum(settings)).toEqual({ name: 'ethereum', rpcUrl: 'eth-url', chainId: 1 })
    expect(chains.base(settings)).toEqual({ name: 'base', rpcUrl: 'base-url', chainId: 8453 })
    expect(chains.robinhood(settings, 'mainnet')).toEqual({
      name: 'robinhood-mainnet',
      rpcUrl: 'robinhood-url',
      chainId: 4663,
    })
  })

  it('fails like a missing required setting when a chain is not configured', () => {
    const unset = makeSettings({ ETHEREUM_RPC_URL: '', BASE_RPC_URL: '' })
    expect(() => chains.ethereum(unset)).toThrow(
      expect.objectContaining({
        statusCode: 500,
        message: 'Missing required environment variable: ETHEREUM_RPC_URL',
      }),
    )
    expect(() => chains.base(unset)).toThrow(
      expect.objectContaining({
        statusCode: 500,
        message: 'Missing required environment variable: BASE_RPC_URL',
      }),
    )
    expect(() => chains.robinhood(settings, 'testnet')).toThrow(
      'Missing required environment variable: ROBINHOOD_TESTNET_RPC_URL',
    )
  })
})

describe('ChainProviders', () => {
  it('shares one provider per chain', () => {
    const providers = new ChainProviders()
    const provider = providers.get(chains.ethereum(settings))

    expect(provider).toEqual({ url: 'eth-url', chainId: 1 })
    expect(providers.get(chains.ethereum(settings))).toBe(provider)
    expect(providers.get(chains.base(settings))).not.toBe(provider)
    expect(JsonRpcProvider).toHaveBeenCalledTimes(2)
  })
})
