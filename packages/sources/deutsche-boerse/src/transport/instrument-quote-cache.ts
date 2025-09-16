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
    const b = this.get(isin) ?? {}
    b.bid = bid
    b.ask = ask
    b.mid = (bid + ask) / 2
    b.quoteProviderTimeUnixMs = providerTime
  }
  addTrade(isin: string, lastPrice: number, providerTime: number) {
    const b = this.get(isin) ?? {}
    b.latestPrice = lastPrice
    b.tradeProviderTimeUnixMs = providerTime
  }
  isEmpty(): boolean {
    return this.map.size === 0
  }
}
