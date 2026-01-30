import { Decimal } from 'decimal.js'

// Conversion factor from pounds to tonnes (1 tonne = 2204.62 lbs)
const LBS_PER_TONNE = 2204.62

export const parseResult = (base: string, quote: string, result: number): number => {
  // Finalto prices XCU/USD in $ per tonne, convert to $ per lb
  if (base === 'XCU' && quote === 'USD') {
    return Decimal.div(result, LBS_PER_TONNE).toNumber()
  }
  return result
}
