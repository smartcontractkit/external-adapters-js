import { JsonRpcProvider } from 'ethers'
import { getTokenData, getTokenMultiplier } from '../../../src/lib/xstocks'

const mockConvertToAssets = jest.fn()
const mockIsPaused = jest.fn()

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    Contract: jest.fn().mockImplementation(() => ({
      convertToAssets: mockConvertToAssets,
      isPaused: mockIsPaused,
    })),
    JsonRpcProvider: jest.fn(),
  }
})

const provider = {} as JsonRpcProvider
const multiplier = '1500000000000000000'

describe('getTokenMultiplier', () => {
  it('should return multiplier', async () => {
    mockConvertToAssets.mockResolvedValue(multiplier)

    expect(await getTokenMultiplier('0x1', provider)).toEqual(BigInt(multiplier))

    expect(mockConvertToAssets).toHaveBeenCalledWith(10n ** 18n)
  })
})

describe('getTokenData', () => {
  it.each([false, true])('should return multiplier and paused=%s', async (paused) => {
    mockConvertToAssets.mockResolvedValue(multiplier)
    mockIsPaused.mockResolvedValue(paused)

    expect(await getTokenData('0x1', provider)).toEqual({ multiplier: BigInt(multiplier), paused })

    expect(mockConvertToAssets).toHaveBeenCalledWith(10n ** 18n)
  })
})
