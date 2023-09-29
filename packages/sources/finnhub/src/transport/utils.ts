export function parseResult(ticker: string, result: number) {
  if (ticker == 'OANDA:WHEAT_USD') {
    // if Ticket OANDA:WHEAT_USD convert result from dollar to cents
    return result * 100
  }
  return result
}
