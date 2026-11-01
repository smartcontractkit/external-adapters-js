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

// Mimics a required framework templated setting: get() throws when the
// variable is not configured
const templated = (setting: string, values: Record<string, string | number>) => {
  const envVarName = (network: string) => setting.replace('NETWORK', network.toUpperCase())
  return {
    get: (network: string) => {
      if (!(network in values)) {
        throw new Error(`Missing required environment variable: ${envVarName(network)}`)
      }
      return values[network]
    },
    getEnvVarName: envVarName,
  }
}

const settingsWith = (robinhood: { rpcUrl?: string; chainId?: number }) =>
  ({
    ETHEREUM_RPC_URL: 'eth-url',
    ETHEREUM_RPC_CHAIN_ID: 1,
    BASE_RPC_URL: '',
    BASE_RPC_CHAIN_ID: 8453,
    ROBINHOOD_NETWORK_RPC_URL: templated(
      'ROBINHOOD_NETWORK_RPC_URL',
      robinhood.rpcUrl ? { mainnet: robinhood.rpcUrl } : {},
    ),
    ROBINHOOD_NETWORK_CHAIN_ID: templated(
      'ROBINHOOD_NETWORK_CHAIN_ID',
      robinhood.chainId ? { mainnet: robinhood.chainId } : {},
    ),
  } as unknown as Parameters<typeof validateMultiplierParams>[0])

const settings = settingsWith({ rpcUrl: 'robinhood-url', chainId: 4663 })
// Robinhood mainnet not configured
const settingsWithoutRobinhood = settingsWith({})

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
    it('resolves ethereum and base from the shared RPC settings', () => {
      expect(getNetworkRpc(settings, 'ethereum')).toEqual({
        url: 'eth-url',
        chainId: 1,
        urlEnvVar: 'ETHEREUM_RPC_URL',
      })
      expect(getNetworkRpc(settings, 'base')).toEqual({
        url: '',
        chainId: 8453,
        urlEnvVar: 'BASE_RPC_URL',
      })
    })

    it('resolves robinhood from the ROBINHOOD_NETWORK settings for mainnet', () => {
      expect(getNetworkRpc(settings, 'robinhood')).toEqual({
        url: 'robinhood-url',
        chainId: 4663,
        urlEnvVar: 'ROBINHOOD_MAINNET_RPC_URL',
      })
    })

    it('leaves robinhood unset when mainnet is not configured', () => {
      expect(getNetworkRpc(settingsWithoutRobinhood, 'robinhood')).toEqual({
        url: undefined,
        chainId: undefined,
        urlEnvVar: 'ROBINHOOD_MAINNET_RPC_URL',
      })
    })

    it('returns undefined for an unsupported network', () => {
      expect(getNetworkRpc(settings, 'unknown')).toBeUndefined()
      expect(getNetworkRpc(settings, 'robinhood-mainnet')).toBeUndefined()
      expect(getNetworkRpc(settings, 'toString')).toBeUndefined()
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

    it('throws for an unsupported network', () => {
      expect(() =>
        validateMultiplierParams(settings, { issuer: 'robinhood', asset: '0xa', network: 'op' }),
      ).toThrow(
        "Unsupported multiplier.network 'op'. Supported networks: ethereum, base, robinhood",
      )
    })

    it('throws when a shared rpc url is empty', () => {
      expect(() =>
        validateMultiplierParams(settings, {
          issuer: 'coinbase',
          asset: '0xa',
          registry: '0xr',
          network: 'base',
        }),
      ).toThrow("Missing RPC URL for multiplier.network 'base'. Set BASE_RPC_URL")
    })

    it('throws when the network rpc url is missing', () => {
      expect(() =>
        validateMultiplierParams(settingsWithoutRobinhood, {
          issuer: 'robinhood',
          asset: '0xa',
          network: 'robinhood',
        }),
      ).toThrow("Missing RPC URL for multiplier.network 'robinhood'. Set ROBINHOOD_MAINNET_RPC_URL")
    })
  })
})
