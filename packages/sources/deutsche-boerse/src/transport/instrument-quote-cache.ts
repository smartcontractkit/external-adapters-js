export type Quote = {
  bid?: number
  ask?: number
  mid?: number
  latestPrice?: number
  quoteProviderTimeUnixMs?: number
  tradeProviderTimeUnixMs?: number
}

export class InstrumentQuoteCache {
  private readonly map = new Map<string, Quote>()

  activate(isin: string) {
    if (!this.map.has(isin)) this.map.set(isin, {})
  }
  deactivate(isin: string) {
    this.map.delete(isin)
  }
  has(isin: string): boolean {
    return this.map.has(isin)
  }
  get(isin: string): Quote | undefined {
    return this.map.get(isin)
  }
  addQuote(isin: string, bid: number, ask: number, providerTime: number) {
    const quote = this.get(isin)
    if (!quote) {
      throw new Error(`Cannot add quote for inactive ISIN ${isin}`)
    }
    quote.bid = bid
    quote.ask = ask
    quote.mid = (bid + ask) / 2
    quote.quoteProviderTimeUnixMs = providerTime
  }
  addTrade(isin: string, lastPrice: number, providerTime: number) {
    const quote = this.get(isin)
    if (!quote) {
      throw new Error(`Cannot add trade for inactive ISIN ${isin}`)
    }
    quote.latestPrice = lastPrice
    quote.tradeProviderTimeUnixMs = providerTime
  }
  isEmpty(): boolean {
    return this.map.size === 0
  }
}
