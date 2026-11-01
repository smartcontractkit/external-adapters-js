import { Contract, JsonRpcProvider } from 'ethers'
import { getRegistryData as getCoinbaseRegistryData } from '../../../src/lib/coinbase'
import {
  clearMultiplierMetadataCache,
  getIssuer,
  getMultiplierMetadata,
  getNetworkRpc,
  issuers,
  validateMultiplierParams,
} from '../../../src/lib/multiplier'
import { getRegistryData as getOndoRegistryData } from '../../../src/lib/registry'
import { getTokenData as getRobinhoodTokenData } from '../../../src/lib/robinhood'

jest.mock('../../../src/lib/coinbase', () => ({ getRegistryData: jest.fn() }))
jest.mock('../../../src/lib/registry', () => ({ getRegistryData: jest.fn() }))
jest.mock('../../../src/lib/robinhood', () => ({ getTokenData: jest.fn() }))

const contracts: Record<string, Record<string, jest.Mock>> = {}
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn().mockImplementation((address: string) => contracts[address]),
}))

const mockCoinbase = getCoinbaseRegistryData as jest.MockedFunction<typeof getCoinbaseRegistryData>
const mockOndo = getOndoRegistryData as jest.MockedFunction<typeof getOndoRegistryData>
const mockRobinhood = getRobinhoodTokenData as jest.MockedFunction<typeof getRobinhoodTokenData>
const MockContract = Contract as unknown as jest.Mock

// Mimics the framework templated settings: NETWORK_RPC_URL resolves ${NETWORK}_RPC_URL
const envName = (network: string, suffix: string) =>
  `${network.replace(/\W/g, '_').toUpperCase()}_${suffix}`

const settingsWith = (env: Record<string, string | number>) =>
  ({
    NETWORK_RPC_URL: {
      get: (network: string) => env[envName(network, 'RPC_URL')],
      getEnvVarName: (network: string) => envName(network, 'RPC_URL'),
    },
    NETWORK_CHAIN_ID: {
      get: (network: string) => env[envName(network, 'CHAIN_ID')],
    },
  } as unknown as Parameters<typeof validateMultiplierParams>[0])

const settings = settingsWith({
  ETHEREUM_RPC_URL: 'eth-url',
  ROBINHOOD_MAINNET_RPC_URL: 'robinhood-url',
  ROBINHOOD_MAINNET_CHAIN_ID: 4663,
  NET_RPC_URL: 'net-url',
})

describe('multiplier', () => {
  const provider = {} as JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()
    clearMultiplierMetadataCache()
    for (const key of Object.keys(contracts)) delete contracts[key]
  })

  describe('metadata', () => {
    it('robinhood reads multiplier decimals from the token', async () => {
      contracts['0xa'] = { decimals: jest.fn().mockResolvedValue(6n) }
      expect(
        await issuers.robinhood.metadata(
          { issuer: 'robinhood', asset: '0xa', network: 'net' },
          provider,
        ),
      ).toEqual({ multiplierDecimals: 6 })
    })

    it('xstocks reads share and underlying decimals', async () => {
      contracts['0xa'] = {
        decimals: jest.fn().mockResolvedValue(18n),
        asset: jest.fn().mockResolvedValue('0xu'),
      }
      contracts['0xu'] = { decimals: jest.fn().mockResolvedValue(6n) }
      expect(
        await issuers.xstocks.metadata(
          { issuer: 'xstocks', asset: '0xa', network: 'net' },
          provider,
        ),
      ).toEqual({
        multiplierDecimals: 6,
        shareDecimals: 18,
      })
    })

    it('coinbase and ondo use the registry multiplier decimals', async () => {
      expect(
        await issuers.coinbase.metadata(
          { issuer: 'coinbase', asset: '0xa', network: 'net' },
          provider,
        ),
      ).toEqual({ multiplierDecimals: 18 })
      expect(
        await issuers.ondo.metadata({ issuer: 'ondo', asset: '0xa', network: 'net' }, provider),
      ).toEqual({
        multiplierDecimals: 18,
      })
      expect(MockContract).not.toHaveBeenCalled()
    })
  })

  describe('read', () => {
    it('robinhood reads token contract', async () => {
      mockRobinhood.mockResolvedValue({ multiplier: 2n, paused: false })
      const result = await issuers.robinhood.read(
        { issuer: 'robinhood', asset: '0xa', network: 'net' },
        provider,
      )
      expect(mockRobinhood).toHaveBeenCalledWith('0xa', provider)
      expect(result).toEqual({ multiplier: 2n, paused: false })
    })

    it('coinbase reads registry', async () => {
      mockCoinbase.mockResolvedValue({ multiplier: 3n, paused: true })
      const result = await issuers.coinbase.read(
        { issuer: 'coinbase', asset: '0xa', registry: '0xr', network: 'net' },
        provider,
      )
      expect(mockCoinbase).toHaveBeenCalledWith('0xa', '0xr', provider)
      expect(result).toEqual({ multiplier: 3n, paused: true })
    })

    it('xstocks converts one whole share and is never paused', async () => {
      const convertToAssets = jest.fn().mockResolvedValue(1_001_701n)
      contracts['0xa'] = { convertToAssets }
      const result = await issuers.xstocks.read(
        { issuer: 'xstocks', asset: '0xa', network: 'net' },
        provider,
        {
          multiplierDecimals: 6,
          shareDecimals: 8,
        },
      )
      expect(convertToAssets).toHaveBeenCalledWith(10n ** 8n)
      expect(result).toEqual({ multiplier: 1_001_701n, paused: false })
    })

    it('ondo reads registry', async () => {
      mockOndo.mockResolvedValue({ multiplier: 5n, paused: false })
      const result = await issuers.ondo.read(
        { issuer: 'ondo', asset: '0xa', registry: '0xr', network: 'net' },
        provider,
      )
      expect(mockOndo).toHaveBeenCalledWith('0xa', '0xr', provider)
      expect(result).toEqual({ multiplier: 5n, paused: false })
    })
  })

  describe('getMultiplierMetadata', () => {
    it('caches metadata per asset and network', async () => {
      const decimals = jest.fn().mockResolvedValue(18n)
      contracts['0xa'] = { decimals }
      const params = { issuer: 'robinhood', asset: '0xa', network: 'net' }

      await getMultiplierMetadata(params, provider, 'net-1')
      await getMultiplierMetadata({ ...params, asset: '0xA' }, provider, 'net-1')
      expect(decimals).toHaveBeenCalledTimes(1)

      await getMultiplierMetadata(params, provider, 'net-2')
      expect(decimals).toHaveBeenCalledTimes(2)
    })

    it('retries after a failed lookup', async () => {
      const decimals = jest.fn().mockRejectedValueOnce(new Error('rpc down')).mockResolvedValue(18n)
      contracts['0xa'] = { decimals }
      const params = { issuer: 'robinhood', asset: '0xa', network: 'net' }

      await expect(getMultiplierMetadata(params, provider, 'net')).rejects.toThrow('rpc down')
      expect(await getMultiplierMetadata(params, provider, 'net')).toEqual({
        multiplierDecimals: 18,
      })
    })
  })

  describe('getNetworkRpc', () => {
    it('resolves the network rpc and chain id', () => {
      expect(getNetworkRpc(settings, 'robinhood-mainnet')).toEqual({
        url: 'robinhood-url',
        chainId: 4663,
      })
    })

    it('leaves the chain id undefined when not configured', () => {
      expect(getNetworkRpc(settings, 'ethereum')).toEqual({ url: 'eth-url', chainId: undefined })
    })

    it('leaves the url undefined for an unknown network', () => {
      expect(getNetworkRpc(settings, 'unknown')).toEqual({ url: undefined, chainId: undefined })
    })
  })

  describe('getIssuer', () => {
    it('throws for unsupported issuer', () => {
      expect(() => getIssuer('unknown')).toThrow(
        "Unsupported multiplier.issuer 'unknown'. Supported issuers: robinhood, coinbase, xstocks, ondo",
      )
    })
  })

  describe('validateMultiplierParams', () => {
    it('passes for valid params', () => {
      expect(() =>
        validateMultiplierParams(settings, {
          issuer: 'coinbase',
          asset: '0xa',
          registry: '0xr',
          network: 'ethereum',
        }),
      ).not.toThrow()
    })

    it('throws when registry is required but missing', () => {
      expect(() =>
        validateMultiplierParams(settings, { issuer: 'ondo', asset: '0xa', network: 'net' }),
      ).toThrow("Missing required parameter multiplier.registry for issuer 'ondo'")
    })

    it('throws when the network rpc url is missing', () => {
      expect(() =>
        validateMultiplierParams(settings, {
          issuer: 'robinhood',
          asset: '0xa',
          network: 'robinhood-testnet',
        }),
      ).toThrow(
        "Missing RPC URL for multiplier.network 'robinhood-testnet'. Set ROBINHOOD_TESTNET_RPC_URL",
      )
    })
  })
})
