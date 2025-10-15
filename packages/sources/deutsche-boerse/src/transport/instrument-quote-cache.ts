import Decimal from 'decimal.js'

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

  private createKey(isin: string, market: string): string {
    return `${isin}-${market}`
  }

  activate(isin: string, market: string) {
    const key = this.createKey(isin, market)
    if (!this.map.has(key)) this.map.set(key, {})
  }
  deactivate(isin: string, market: string) {
    const key = this.createKey(isin, market)
    this.map.delete(key)
  }
  has(isin: string, market: string): boolean {
    const key = this.createKey(isin, market)
    return this.map.has(key)
  }
  get(isin: string, market: string): Quote | undefined {
    const key = this.createKey(isin, market)
    return this.map.get(key)
  }
  addQuote(isin: string, market: string, bid: number, ask: number, providerTime: number) {
    const quote = this.get(isin, market)
    if (!quote) {
      throw new Error(`Cannot add quote for inactive instrument ${isin} on market ${market}`)
    }
    const mid = new Decimal(bid).plus(ask).div(2)
    quote.bid = bid
    quote.ask = ask
    quote.mid = mid.toNumber()
    quote.quoteProviderTimeUnixMs = providerTime
  }
  addTrade(isin: string, market: string, lastPrice: number, providerTime: number) {
    const quote = this.get(isin, market)
    if (!quote) {
      throw new Error(`Cannot add trade for inactive instrument ${isin} on market ${market}`)
    }
    quote.latestPrice = lastPrice
    quote.tradeProviderTimeUnixMs = providerTime
  }
  isEmpty(): boolean {
    return this.map.size === 0
  }
}
