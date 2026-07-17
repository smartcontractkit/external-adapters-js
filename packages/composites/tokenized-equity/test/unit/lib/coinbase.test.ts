import { JsonRpcProvider } from 'ethers'
import { getRegistryData } from '../../../src/lib/coinbase'

const mockGetOracleParams = jest.fn()

jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    getOracleParams: mockGetOracleParams,
  })),
  JsonRpcProvider: jest.fn(),
}))

describe('getRegistryData', () => {
  it('should return multiplier and paused status', async () => {
    const multiplier = '1500000000000000000'
    mockGetOracleParams.mockResolvedValue({ multiplier, paused: false })

    expect(await getRegistryData('0x0', '0x1', {} as JsonRpcProvider)).toEqual({
      multiplier: BigInt(multiplier),
      paused: false,
    })
  })
})
