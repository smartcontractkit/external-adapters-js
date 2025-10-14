import { JsonRpcProvider } from 'ethers'
import { getBounds } from '../../src/transport/contract'

jest.mock('ethers', () => {
  return {
    Contract: function (address: string) {
      if (address == 'registry') {
        return {
          getParametersForAsset: jest.fn().mockImplementation((asset) => {
            return {
              maxExpectedApy: '100',
              upperBoundTolerance: '200',
              lowerBoundTolerance: '300',
              maxDiscount: '400',
              isUpperBoundEnabled: asset == 'enabled',
              isLowerBoundEnabled: asset == 'enabled',
            }
          }),
          getOracle: jest.fn().mockImplementation(() => {
            return 'proxy'
          }),
          getLookbackData: jest.fn().mockImplementation(() => {
            return {
              answer: '25',
              updatedAt: '10000',
            }
          }),
        }
      } else if (address == 'proxy') {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return '6'
          }),
          aggregator: jest.fn().mockImplementation(() => {
            return 'aggregator'
          }),
        }
      } else if (address == 'aggregator') {
        return {
          decimals: jest.fn().mockImplementation(() => {
            return '6'
          }),
          latestRoundData: jest.fn().mockImplementation(() => {
            return {
              answer: '35',
              updatedAt: '20000',
            }
          }),
        }
      } else {
        throw new Error(`${address} not mocked`)
      }
    },
    JsonRpcProvider: jest.fn(),
  }
})

describe('getBounds', () => {
  it('return bounds', async () => {
    await expect(
      getBounds({ asset: 'enabled', registry: 'registry' }, {} as JsonRpcProvider),
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
      getBounds({ asset: 'disabled', registry: 'registry' }, {} as JsonRpcProvider),
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
