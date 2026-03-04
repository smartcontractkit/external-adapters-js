import { JsonRpcProvider } from 'ethers'
import { getBounds } from '../../src/transport/contract'

const REGISTRY_DEFAULT = 'registry'
const REGISTRY_ROUND_0 = 'registry-round0'
const REGISTRY_ROUND_11 = 'registry-round11'
const REGISTRY_LATEST_0 = 'registry-latest0'
const REGISTRY_LATEST_11 = 'registry-latest11'

jest.mock('ethers', () => ({
  Contract: function (address: string) {
    if (address.startsWith('registry')) {
      return {
        getParametersForAsset: jest.fn().mockImplementation((asset: string) => ({
          maxExpectedApy: '100',
          upperBoundTolerance: '200',
          lowerBoundTolerance: '300',
          maxDiscount: '400',
          isUpperBoundEnabled: asset == 'enabled',
          isLowerBoundEnabled: asset == 'enabled',
        })),
        getOracle: jest.fn().mockImplementation(() => {
          if (address === 'registry-latest0') return 'proxy-latest0'
          if (address === 'registry-latest11') return 'proxy-latest11'
          return 'proxy'
        }),
        getLookbackData: jest.fn().mockImplementation(() => {
          if (address === 'registry-round0') {
            return { roundId: 0, answer: '0', updatedAt: '0' }
          }
          if (address === 'registry-round11') {
            return { roundId: 11, answer: '0', updatedAt: '1' }
          }
          return { roundId: 1, answer: '25', updatedAt: '10000' }
        }),
      }
    }
    if (address.startsWith('proxy')) {
      return {
        aggregator: jest.fn().mockImplementation(() => {
          if (address === 'proxy-latest0') return 'aggregator-latest0'
          if (address === 'proxy-latest11') return 'aggregator-latest11'
          return 'aggregator'
        }),
      }
    }
    if (address.startsWith('aggregator')) {
      return {
        decimals: jest.fn().mockImplementation(() => '6'),
        latestRoundData: jest.fn().mockImplementation(() => {
          if (address === 'aggregator-latest0') {
            return { roundId: 0, answer: '0', updatedAt: '0' }
          }
          if (address === 'aggregator-latest11') {
            return { roundId: 11, answer: '0', updatedAt: '1' }
          }
          return { roundId: 1, answer: '35', updatedAt: '20000' }
        }),
      }
    }
    throw new Error(`${address} not mocked`)
  },
  JsonRpcProvider: jest.fn(),
}))

describe('getBounds', () => {
  it('when roundId is 0, accepts 0 lookbackNav/lookbackTime', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: REGISTRY_ROUND_0 }, {} as JsonRpcProvider),
    ).resolves.toEqual({
      lower: {
        isLowerBoundEnabled: true,
        latestNav: 35n,
        latestTime: 20000,
        lowerBoundTolerance: 300,
        maxDiscount: 400,
      },
      upper: {
        isUpperBoundEnabled: true,
        lookbackNav: 0n,
        lookbackTime: 0,
        maxExpectedApy: 100,
        upperBoundTolerance: 200,
      },
      decimals: 6,
    })
  })

  it('when roundId is larger than 0, rejects 0 lookbackNav/lookbackTime', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: REGISTRY_ROUND_11 }, {} as JsonRpcProvider),
    ).rejects.toThrow('Invalid lookback data: roundId 11, answer 0, updatedAt 1')
  })

  it('when latest roundId is 0, accepts 0 latestNav/latestTime', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: REGISTRY_LATEST_0 }, {} as JsonRpcProvider),
    ).resolves.toEqual({
      lower: {
        isLowerBoundEnabled: true,
        latestNav: 0n,
        latestTime: 0,
        maxDiscount: 400,
        lowerBoundTolerance: 300,
      },
      upper: {
        isUpperBoundEnabled: true,
        lookbackNav: 25n,
        lookbackTime: 10000,
        maxExpectedApy: 100,
        upperBoundTolerance: 200,
      },
      decimals: 6,
    })
  })

  it('when latest roundId is larger than 0, rejects 0 latestNav/latestTime', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: REGISTRY_LATEST_11 }, {} as JsonRpcProvider),
    ).rejects.toThrow('Invalid latest data: roundId 11, answer 0, updatedAt 1')
  })

  it('return bounds', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: REGISTRY_DEFAULT }, {} as JsonRpcProvider),
    ).resolves.toEqual({
      lower: {
        isLowerBoundEnabled: true,
        latestNav: 35n,
        latestTime: 20000,
        maxDiscount: 400,
        lowerBoundTolerance: 300,
      },
      upper: {
        isUpperBoundEnabled: true,
        lookbackNav: 25n,
        lookbackTime: 10000,
        maxExpectedApy: 100,
        upperBoundTolerance: 200,
      },
      decimals: 6,
    })
  })

  it('disabled', async () => {
    await expect(
      getBounds({ asset: 'disabled', registry: REGISTRY_DEFAULT }, {} as JsonRpcProvider),
    ).resolves.toEqual({
      lower: {
        isLowerBoundEnabled: false,
        latestNav: 0n,
        latestTime: 0,
        maxDiscount: 400,
        lowerBoundTolerance: 300,
      },
      upper: {
        isUpperBoundEnabled: false,
        lookbackNav: 0n,
        lookbackTime: 0,
        maxExpectedApy: 100,
        upperBoundTolerance: 200,
      },
      decimals: 6,
    })
  })
})
