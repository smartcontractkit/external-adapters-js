import { types } from '@chainlink/token-allocation-adapter'
import parser from 'csv-parse'
import { Logger } from '@chainlink/ea-bootstrap'
import { Decimal } from 'decimal.js'

const ROW_SYMBOLS = 0
const ROW_UNITS = 4

export const parseData = (input: Buffer | string): Promise<types.TokenAllocations> => {
  return new Promise<types.TokenAllocations>((resolve, reject) => {
    parser(input, (err, data: string[][]) => {
      if (err) {
        return reject(err)
      }

      if (data.length < 5) {
        return reject('CSV file has less than 5 rows and cant be parsed')
      } else if (data.length != 9) {
        Logger.warn(
          `CSV data has ${data.length} rows, but we expect 9. This data may be malformed!`,
        )
      }

      const numSymbols = data[0].length - 1
      const allocations: types.TokenAllocations = new Array(numSymbols).fill(0).map((_, index) => ({
        symbol: data[ROW_SYMBOLS][index + 1].toUpperCase(),
        balance: new Decimal(data[ROW_UNITS][index + 1]).mul(1e18).toFixed(0),
        decimals: 18,
      }))
      resolve(allocations)
    })
  })
}
