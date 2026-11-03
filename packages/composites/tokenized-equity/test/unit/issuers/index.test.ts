import { JsonRpcProvider } from 'ethers'
import {
  coinbase,
  getIssuer,
  Issuer,
  issuerNames,
  MULTIPLIER_DECIMALS,
  ondo,
  robinhood,
  xstocks,
} from '../../../src/issuers'
import { getRegistryData as getCoinbaseRegistryData } from '../../../src/lib/coinbase'
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

// Only Robinhood mainnet is configured, like stage and prod. Base has no RPC URL
const settings = {
  ETHEREUM_RPC_URL: 'eth-url',
  ETHEREUM_RPC_CHAIN_ID: 1,
  BASE_RPC_URL: '',
  BASE_RPC_CHAIN_ID: 8453,
  ROBINHOOD_NETWORK_RPC_URL: templated('ROBINHOOD_NETWORK_RPC_URL', { mainnet: 'robinhood-url' }),
  ROBINHOOD_NETWORK_CHAIN_ID: templated('ROBINHOOD_NETWORK_CHAIN_ID', { mainnet: 4663 }),
} as unknown as Parameters<Issuer['validate']>[0]

describe('issuers', () => {
  const provider = {} as JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(contracts)) delete contracts[key]
  })

  describe('directory', () => {
    it('lists every issuer by name', () => {
      expect(issuerNames).toEqual(['robinhood', 'coinbase', 'xstocks', 'ondo'])
      for (const name of issuerNames) {
        expect(getIssuer(name).name).toBe(name)
      }
    })

    it('uses the hardcoded 18 decimal multiplier', () => {
      expect(MULTIPLIER_DECIMALS).toBe(18)
    })

    it('throws 400 for an unsupported issuer', () => {
      expect(() => getIssuer('unknown')).toThrow(
        "Unsupported issuer 'unknown'. Supported issuers: robinhood, coinbase, xstocks, ondo",
      )
    })

    it('rejects inherited property names', () => {
      expect(() => getIssuer('toString')).toThrow("Unsupported issuer 'toString'")
    })
  })

  describe('read', () => {
    it('robinhood reads the token contract', async () => {
      mockRobinhood.mockResolvedValue({ multiplier: 2n, paused: false })
      const result = await robinhood.read({ asset: '0xa' }, provider)
      expect(mockRobinhood).toHaveBeenCalledWith('0xa', provider)
      expect(result).toEqual({ multiplier: 2n, paused: false })
    })

    it('coinbase reads the registry', async () => {
      mockCoinbase.mockResolvedValue({ multiplier: 3n, paused: false })
      const result = await coinbase.read({ asset: '0xa', registry: '0xr' }, provider)
      expect(mockCoinbase).toHaveBeenCalledWith('0xa', '0xr', provider)
      expect(result).toEqual({ multiplier: 3n, paused: false })
    })

    it('ondo reads the registry', async () => {
      mockOndo.mockResolvedValue({ multiplier: 5n, paused: false })
      const result = await ondo.read({ asset: '0xa', registry: '0xr' }, provider)
      expect(mockOndo).toHaveBeenCalledWith('0xa', '0xr', provider)
      expect(result).toEqual({ multiplier: 5n, paused: false })
    })

    it('registry issuers reject with 400 without a registry', async () => {
      await expect(coinbase.read({ asset: '0xa' }, provider)).rejects.toMatchObject({
        statusCode: 400,
        message: "Missing required parameter registry for issuer 'coinbase'",
      })
      await expect(ondo.read({ asset: '0xa' }, provider)).rejects.toMatchObject({
        statusCode: 400,
        message: "Missing required parameter registry for issuer 'ondo'",
      })
      expect(mockCoinbase).not.toHaveBeenCalled()
      expect(mockOndo).not.toHaveBeenCalled()
    })

    it('xstocks converts one whole 18 decimal share and reads the pause state', async () => {
      const convertToAssets = jest.fn().mockResolvedValue(1_001_701_196_801_074_000n)
      const isPaused = jest.fn().mockResolvedValue(false)
      contracts['0xa'] = { convertToAssets, isPaused }
      const result = await xstocks.read({ asset: '0xa' }, provider)
      expect(convertToAssets).toHaveBeenCalledWith(10n ** 18n)
      expect(isPaused).toHaveBeenCalled()
      expect(result).toEqual({ multiplier: 1_001_701_196_801_074_000n, paused: false })
    })

    it('throws 503 when the asset is paused', async () => {
      contracts['0xa'] = {
        convertToAssets: jest.fn().mockResolvedValue(10n ** 18n),
        isPaused: jest.fn().mockResolvedValue(true),
      }
      await expect(xstocks.read({ asset: '0xa' }, provider)).rejects.toMatchObject({
        statusCode: 503,
        message: "asset: '0xa' paused for issuer 'xstocks'",
      })
    })
  })
  describe('validate', () => {
    it('passes when the issuer RPC is configured', () => {
      expect(() => ondo.validate(settings, { asset: '0xa', registry: '0xr' })).not.toThrow()
      expect(() => xstocks.validate(settings, { asset: '0xa' })).not.toThrow()
      expect(() => robinhood.validate(settings, { asset: '0xa', network: 'mainnet' })).not.toThrow()
    })

    it('requires a registry for registry issuers', () => {
      for (const name of ['coinbase', 'ondo'] as const) {
        expect(() => getIssuer(name).validate(settings, { asset: '0xa' })).toThrow(
          `Missing required parameter registry for issuer '${name}'`,
        )
      }
    })

    it('throws 400 when the issuer chain RPC URL is not set', () => {
      expect(() => coinbase.validate(settings, { asset: '0xa', registry: '0xr' })).toThrowError(
        expect.objectContaining({ statusCode: 400, message: 'Missing BASE_RPC_URL' }),
      )
    })

    it('robinhood requires a configured network', () => {
      expect(() => robinhood.validate(settings, { asset: '0xa' })).toThrow(
        "Missing required parameter network for issuer 'robinhood'",
      )
      expect(() => robinhood.validate(settings, { asset: '0xa', network: 'testnet' })).toThrow(
        'Missing required environment variable: ROBINHOOD_TESTNET_RPC_URL',
      )
    })
  })

  describe('rpc', () => {
    it('reads each issuer from its chain', () => {
      expect(coinbase.rpc({ ...settings, BASE_RPC_URL: 'base-url' })).toEqual({
        url: 'base-url',
        chainId: 8453,
      })
      for (const name of ['ondo', 'xstocks'] as const) {
        expect(getIssuer(name).rpc(settings, { asset: '0xa' })).toEqual({
          url: 'eth-url',
          chainId: 1,
        })
      }
      expect(robinhood.rpc(settings, { asset: '0xa', network: 'mainnet' })).toEqual({
        url: 'robinhood-url',
        chainId: 4663,
      })
    })
  })
})
