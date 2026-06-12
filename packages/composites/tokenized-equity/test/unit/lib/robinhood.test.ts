import { JsonRpcProvider } from 'ethers'
import { getTokenData } from '../../../src/lib/robinhood'

const mockGetUiMultiplier = jest.fn()
const mockGetOraclePaused = jest.fn()

jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    uiMultiplier: mockGetUiMultiplier,
    oraclePaused: mockGetOraclePaused,
  })),
  JsonRpcProvider: jest.fn(),
}))

describe('getTokenData', () => {
  it('should return multiplier and paused status', async () => {
    const multiplier = '1500000000000000000'
    mockGetUiMultiplier.mockResolvedValue(multiplier)
    mockGetOraclePaused.mockResolvedValue(false)

    expect(await getTokenData('0x1', {} as JsonRpcProvider)).toEqual({
      multiplier: BigInt(multiplier),
      paused: false,
    })
  })
})
