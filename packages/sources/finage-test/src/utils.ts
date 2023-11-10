export function checkInversableUSDForex(base: string, quote: string) {
  if (
    quote.toUpperCase() == 'USD' &&
    !['EUR', 'GBP', 'NZD', 'XAG', 'XAU', 'XPT', 'XPD', 'XCU'].includes(base.toUpperCase())
  )
    return true
  return false
}

export function createForexRestSymbol(base: string, quote: string) {
  if (checkInversableUSDForex(base, quote)) {
    return `${quote}${base}`.toUpperCase()
  } else {
    return `${base}${quote}`.toUpperCase()
  }
}

export function createForexWsSymbol(base: string, quote: string) {
  if (checkInversableUSDForex(base, quote)) {
    return `${quote}/${base}`.toUpperCase()
  } else {
    return `${base}/${quote}`.toUpperCase()
  }
}

export function invertResult(base: string, quote: string, result: number) {
  if (checkInversableUSDForex(base, quote)) {
    return 1 / result
  }
  return result
}
