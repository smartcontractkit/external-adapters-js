import { parseData } from '../../src/csv'
import { types } from '@chainlink/token-allocation-adapter'

const input = [
  'Symbol,BTC,ETH',
  'Name,Bitcoin,Ethereum',
  'Date (UTC),,',
  'Weight,0.55497847,0.213188463',
  'Unit,0.010542985,0.055841795'
].join('\n')

describe('CSV parsing', () => {
  it('should successfully parse CSV data into token allocations', async () => {
    const result = await parseData(input)
    expect(result).toStrictEqual([
      {
        symbol: 'BTC',
        balance: '10542985000000000',
        decimals: 18
      },
      {
        symbol: 'ETH',
        balance: '55841795000000000',
        decimals: 18
      },
    ] as types.TokenAllocations)
  })
})
