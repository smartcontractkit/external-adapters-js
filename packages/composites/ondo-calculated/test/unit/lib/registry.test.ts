import { JsonRpcProvider } from 'ethers'
import { getRegistryData } from '../../../src/lib/registry'

const mockGetSValue = jest.fn()

jest.mock('ethers', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    getSValue: mockGetSValue,
  })),
  JsonRpcProvider: jest.fn(),
}))

describe('getRegistryData', () => {
  it('should return multiplier and paused status', async () => {
    const sValue = '1500000000000000000'
    mockGetSValue.mockResolvedValue({ sValue, paused: false })

    expect(await getRegistryData('0x0', '0x1', {} as JsonRpcProvider)).toEqual({
      multiplier: BigInt(sValue),
      paused: false,
    })
  })
})
