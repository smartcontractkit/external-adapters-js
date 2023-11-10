export function checkInversableUSDForex(base: string, quote: string) {
  if (
    quote.toUpperCase() == 'USD' &&
    !['EUR', 'GBP', 'NZD', 'XAG', 'XAU', 'XPT', 'XPD', 'XCU'].includes(base.toUpperCase())
  )
    return true
  return false
}

export function invertPair(base: string, quote: string) {
  if (checkInversableUSDForex(base, quote)) {
    return [quote.toUpperCase(), base.toUpperCase()]
  }
  return [base.toUpperCase(), quote.toUpperCase()]
}

export function invertResult(base: string, quote: string, result: number) {
  if (checkInversableUSDForex(base, quote)) {
    return 1 / result
  }
  return result
}
