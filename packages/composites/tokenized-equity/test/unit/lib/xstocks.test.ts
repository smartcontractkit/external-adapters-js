import { JsonRpcProvider } from 'ethers'
import { getTokenMultiplier } from '../../../src/lib/xstocks'

const mockConvertToAssets = jest.fn()

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  return {
    ...actualModule,
    Contract: jest.fn().mockImplementation(() => ({
      convertToAssets: mockConvertToAssets,
    })),
    JsonRpcProvider: jest.fn(),
  }
})

describe('getTokenMultiplier', () => {
  it('should return multiplier', async () => {
    const multiplier = '1500000000000000000'
    mockConvertToAssets.mockResolvedValue(multiplier)

    expect(await getTokenMultiplier('0x1', {} as JsonRpcProvider)).toEqual(BigInt(multiplier))

    expect(mockConvertToAssets).toHaveBeenCalledWith(10n ** 18n)
  })
})
