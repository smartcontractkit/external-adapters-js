import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { issuers } from '../../../src/issuers'
import { ChainProviders } from '../../../src/lib/chains'
import { getDataEngineResult } from '../../../src/lib/dataEngine'
import { scaleDecimals } from '../../../src/lib/decimals'
import { calculatePrice } from '../../../src/transport/issuerPrice247'
import { makeSettings } from '../fixtures/settings'

LoggerFactoryProvider.set()

// Contract methods by address, set per test
const contracts: Record<string, Record<string, jest.Mock>> = {}

jest.mock('../../../src/lib/dataEngine', () => ({ getDataEngineResult: jest.fn() }))
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  JsonRpcProvider: jest
    .fn()
    .mockImplementation((url: string, chainId: number) => ({ url, chainId })),
  Contract: jest.fn().mockImplementation((address: string) => contracts[address]),
}))
const mockGetDataEngineResult = getDataEngineResult as jest.MockedFunction<
  typeof getDataEngineResult
>

const data = {
  mid: '1',
  lastSeenTimestampNs: '2',
  bid: '3',
  bidVolume: 4,
  ask: '5',
  askVolume: 6,
  lastTradedPrice: '7',
  marketStatus: 4,
  decimals: 18,
}

const settings = makeSettings()
const requester = {} as Requester

const param = {
  settings,
  requester,
  providers: new ChainProviders(),
  targetEndpoint: 'v11' as const,
  feedId: '0x000b',
  resultPath: 'lastTradedPrice' as const,
  decimals: 8,
}

const stream = {
  url: 'http://data-engine',
  requester,
  targetEndpoint: 'v11',
  feedId: '0x000b',
  resultPath: 'lastTradedPrice',
}

describe('scaleDecimals', () => {
  it('scales down with truncation', () => {
    expect(scaleDecimals(123456789n, 6, 2)).toBe(12345n)
  })

  it('scales up', () => {
    expect(scaleDecimals(12n, 2, 6)).toBe(120000n)
  })

  it('keeps value when decimals match', () => {
    expect(scaleDecimals(12n, 4, 4)).toBe(12n)
  })
})

describe('calculatePrice', () => {
  let getMultiplier: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    getMultiplier = jest.spyOn(issuers.robinhood, 'getMultiplier')
  })

  afterEach(() => {
    getMultiplier.mockRestore()
  })

  describe('without a multiplier', () => {
    it('returns the stream price requested in the output decimals', async () => {
      mockGetDataEngineResult.mockResolvedValue({ result: '32398429239', data })

      expect(await calculatePrice(param)).toEqual({
        result: '32398429239',
        decimals: 8,
        rawPrice: '32398429239',
        rawPriceDecimals: 8,
        dataEngine: data,
      })
      expect(mockGetDataEngineResult).toHaveBeenCalledWith({ ...stream, decimals: 8 })
      expect(getMultiplier).not.toHaveBeenCalled()
    })
  })

  describe('with a multiplier', () => {
    const multiplier = { issuer: 'robinhood' as const, asset: '0xa', network: 'mainnet' }

    it('requests the price in the 18 multiplier decimals', async () => {
      mockGetDataEngineResult.mockResolvedValue({ result: '325000000000000000000', data })
      getMultiplier.mockResolvedValue(2n * 10n ** 18n)

      expect(await calculatePrice({ ...param, multiplier })).toEqual({
        result: '65000000000',
        decimals: 8,
        rawPrice: '325000000000000000000',
        rawPriceDecimals: 18,
        rawMultipliedPrice: (650n * 10n ** 36n).toString(),
        rawMultipliedPriceDecimals: 36,
        dataEngine: data,
        multiplier: {
          issuer: 'robinhood',
          network: 'mainnet',
          value: '2000000000000000000',
          decimals: 18,
        },
      })
      expect(mockGetDataEngineResult).toHaveBeenCalledWith({ ...stream, decimals: 18 })
      expect(getMultiplier).toHaveBeenCalledWith(multiplier, {
        url: 'robinhood-url',
        chainId: 4663,
      })
    })

    it('applies output decimals after multiplying', async () => {
      // Live robinhood GOOGL values: scaling the price to 8 decimals before
      // multiplying truncates twice and returns 32404712085
      mockGetDataEngineResult.mockResolvedValue({ result: '323984292398371634149', data })
      getMultiplier.mockResolvedValue(1000193924414112587n)

      const result = await calculatePrice({ ...param, multiplier })
      expect(result.result).toBe('32404712086')
      expect(result.rawMultipliedPrice).toBe(
        (323984292398371634149n * 1000193924414112587n).toString(),
      )
    })

    it('scales up when output decimals exceed the product decimals', async () => {
      mockGetDataEngineResult.mockResolvedValue({ result: '15' + '0'.repeat(17), data })
      getMultiplier.mockResolvedValue(2n * 10n ** 18n)

      const result = await calculatePrice({ ...param, decimals: 40, multiplier })
      expect(result.result).toBe('3' + '0'.repeat(40))
    })
  })

  // The issuers' contracts report a paused asset, multiplier 2
  describe('when the asset is paused', () => {
    const paused = {
      robinhood: {
        multiplier: { issuer: 'robinhood' as const, asset: '0xa', network: 'mainnet' },
        contracts: {
          '0xa': {
            uiMultiplier: jest.fn().mockResolvedValue(2n * 10n ** 18n),
            oraclePaused: jest.fn().mockResolvedValue(true),
          },
        },
      },
      coinbase: {
        multiplier: { issuer: 'coinbase' as const, asset: '0xa', registry: '0xr' },
        contracts: {
          '0xr': {
            getOracleParams: jest
              .fn()
              .mockResolvedValue({ multiplier: 2n * 10n ** 18n, paused: true }),
          },
        },
      },
      ondo: {
        multiplier: { issuer: 'ondo' as const, asset: '0xa', registry: '0xr' },
        contracts: {
          '0xr': {
            getSValue: jest.fn().mockResolvedValue({ sValue: 2n * 10n ** 18n, paused: true }),
          },
        },
      },
      xstocks: {
        multiplier: { issuer: 'xstocks' as const, asset: '0xa' },
        contracts: {
          '0xa': {
            convertToAssets: jest.fn().mockResolvedValue(2n * 10n ** 18n),
            isPaused: jest.fn().mockResolvedValue(true),
          },
        },
      },
    }

    beforeEach(() => {
      getMultiplier.mockRestore()
      for (const address of Object.keys(contracts)) delete contracts[address]
      mockGetDataEngineResult.mockResolvedValue({ result: '325000000000000000000', data })
    })

    it.each(['robinhood', 'coinbase', 'ondo'] as const)(
      '%s does not compute a price and fails with 503',
      async (issuer) => {
        Object.assign(contracts, paused[issuer].contracts)

        await expect(
          calculatePrice({ ...param, multiplier: paused[issuer].multiplier }),
        ).rejects.toMatchObject({
          statusCode: 503,
          message: `asset: '0xa' paused for issuer '${issuer}'`,
        })
      },
    )

    it('xstocks ignores the pause and computes the price', async () => {
      Object.assign(contracts, paused.xstocks.contracts)

      const result = await calculatePrice({ ...param, multiplier: paused.xstocks.multiplier })

      expect(result.result).toBe('65000000000')
      expect(contracts['0xa'].isPaused).not.toHaveBeenCalled()
    })
  })
})
