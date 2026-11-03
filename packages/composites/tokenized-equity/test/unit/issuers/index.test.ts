import { JsonRpcProvider } from 'ethers'
import { AssetRequest, IssuerName, issuerNames, issuers } from '../../../src/issuers'
import { Chain } from '../../../src/lib/chains'
import { makeSettings } from '../fixtures/settings'

// Contract methods by address, set per test
const contracts: Record<string, Record<string, jest.Mock>> = {}

jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  Contract: jest.fn().mockImplementation((address: string) => contracts[address]),
}))

const settings = makeSettings()
const provider = {} as JsonRpcProvider

// For each issuer: a request it can serve, the chain it reads from, and its
// contract mocked to return a multiplier of 2 and the given pause state
const cases: Record<
  IssuerName,
  {
    request: AssetRequest
    chain: Chain
    mockContract: (paused: boolean) => typeof contracts
  }
> = {
  robinhood: {
    request: { asset: '0xa', network: 'mainnet' },
    chain: { name: 'robinhood-mainnet', rpcUrl: 'robinhood-url', chainId: 4663 },
    mockContract: (paused) => ({
      '0xa': {
        uiMultiplier: jest.fn().mockResolvedValue(2n),
        oraclePaused: jest.fn().mockResolvedValue(paused),
      },
    }),
  },
  coinbase: {
    request: { asset: '0xa', registry: '0xr' },
    chain: { name: 'base', rpcUrl: 'base-url', chainId: 8453 },
    mockContract: (paused) => ({
      '0xr': { getOracleParams: jest.fn().mockResolvedValue({ multiplier: 2n, paused }) },
    }),
  },
  xstocks: {
    request: { asset: '0xa' },
    chain: { name: 'ethereum', rpcUrl: 'eth-url', chainId: 1 },
    mockContract: (paused) => ({
      '0xa': {
        convertToAssets: jest.fn().mockResolvedValue(2n),
        isPaused: jest.fn().mockResolvedValue(paused),
      },
    }),
  },
  ondo: {
    request: { asset: '0xa', registry: '0xr' },
    chain: { name: 'ethereum', rpcUrl: 'eth-url', chainId: 1 },
    mockContract: (paused) => ({
      '0xr': { getSValue: jest.fn().mockResolvedValue({ sValue: 2n, paused }) },
    }),
  },
}

describe('issuers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    for (const address of Object.keys(contracts)) delete contracts[address]
  })

  it('lists every issuer by name', () => {
    expect(issuerNames).toEqual(['robinhood', 'coinbase', 'xstocks', 'ondo'])
    for (const name of issuerNames) {
      expect(issuers[name].name).toBe(name)
    }
  })

  describe.each(issuerNames)('%s', (name) => {
    const issuer = issuers[name]
    const { request, chain, mockContract } = cases[name]

    it('reads from its chain', () => {
      expect(issuer.chain(settings, request)).toEqual(chain)
    })

    it('accepts a request it can serve', () => {
      expect(() => issuer.validate(settings, request)).not.toThrow()
    })

    it('rejects a request when its chain is not configured', () => {
      const unset = makeSettings({ ETHEREUM_RPC_URL: '', BASE_RPC_URL: '' })
      expect(() => issuer.validate(unset, { ...request, network: 'testnet' })).toThrow(
        'Missing required environment variable',
      )
    })

    it('reads the multiplier', async () => {
      Object.assign(contracts, mockContract(false))
      expect(await issuer.getMultiplier(request, provider)).toBe(2n)
    })

    it('throws 503 when the asset is paused', async () => {
      Object.assign(contracts, mockContract(true))
      await expect(issuer.getMultiplier(request, provider)).rejects.toMatchObject({
        statusCode: 503,
        message: `asset: '0xa' paused for issuer '${name}'`,
      })
    })
  })

  it('robinhood requires a network', () => {
    expect(() => issuers.robinhood.validate(settings, { asset: '0xa' })).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: "Missing required parameter network for issuer 'robinhood'",
      }),
    )
  })

  it('xstocks converts one whole 18 decimal share', async () => {
    Object.assign(contracts, cases.xstocks.mockContract(false))
    await issuers.xstocks.getMultiplier(cases.xstocks.request, provider)
    expect(contracts['0xa'].convertToAssets).toHaveBeenCalledWith(10n ** 18n)
  })

  describe.each(['coinbase', 'ondo'] as const)('%s registry', (name) => {
    it('is required', async () => {
      const error = {
        statusCode: 400,
        message: `Missing required parameter registry for issuer '${name}'`,
      }
      expect(() => issuers[name].validate(settings, { asset: '0xa' })).toThrow(
        expect.objectContaining(error),
      )
      await expect(issuers[name].getMultiplier({ asset: '0xa' }, provider)).rejects.toMatchObject(
        error,
      )
    })
  })
})
