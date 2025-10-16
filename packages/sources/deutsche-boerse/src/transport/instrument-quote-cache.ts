import Decimal from 'decimal.js'

export type Quote = {
  bid?: number
  ask?: number
  mid?: number
  bidSize?: number
  askSize?: number
  latestPrice?: number
  quoteProviderTimeUnixMs?: number
  tradeProviderTimeUnixMs?: number
}

export class InstrumentQuoteCache {
  private readonly map = new Map<string, Quote>()

  private createKey(market: string, isin: string): string {
    return `${market}-${isin}`
  }

  activate(market: string, isin: string) {
    const key = this.createKey(market, isin)
    if (!this.map.has(key)) this.map.set(key, {})
  }
  deactivate(market: string, isin: string) {
    const key = this.createKey(market, isin)
    this.map.delete(key)
  }
  has(market: string, isin: string): boolean {
    const key = this.createKey(market, isin)
    return this.map.has(key)
  }
  get(market: string, isin: string): Quote | undefined {
    const key = this.createKey(market, isin)
    return this.map.get(key)
  }
  addQuote(
    market: string,
    isin: string,
    bid: number,
    ask: number,
    providerTime: number,
    bidSz?: number,
    askSz?: number,
  ) {
    const quote = this.get(market, isin)
    if (!quote) {
      throw new Error(`Cannot add quote for inactive instrument ${market}-${isin}`)
    }
    const mid = new Decimal(bid).plus(ask).div(2)
    quote.bid = bid
    quote.ask = ask
    quote.mid = mid.toNumber()
    quote.quoteProviderTimeUnixMs = providerTime
    quote.bidSize = bidSz
    quote.askSize = askSz
  }
  addBid(market: string, isin: string, bid: number, providerTime: number, bidSz?: number) {
    const quote = this.get(market, isin)
    if (!quote) {
      throw new Error(`Cannot add quote for inactive ISIN ${isin}`)
    }
    if (quote.ask !== undefined) {
      const mid = new Decimal(bid).plus(quote.ask).div(2)
      quote.mid = mid.toNumber()
    }
    quote.bid = bid
    quote.quoteProviderTimeUnixMs = providerTime
    quote.bidSize = bidSz
  }
  addAsk(market: string, isin: string, ask: number, providerTime: number, askSz?: number) {
    const quote = this.get(market, isin)
    if (!quote) {
      throw new Error(`Cannot add quote for inactive ISIN ${isin}`)
    }

    if (quote.bid !== undefined) {
      const mid = new Decimal(quote.bid).plus(ask).div(2)
      quote.mid = mid.toNumber()
    }
    quote.ask = ask
    quote.quoteProviderTimeUnixMs = providerTime
    quote.askSize = askSz
  }

  addTrade(market: string, isin: string, lastPrice: number, providerTime: number) {
    const quote = this.get(market, isin)
    if (!quote) {
      throw new Error(`Cannot add trade for inactive instrument ${market}-${isin}`)
    }
    quote.latestPrice = lastPrice
    quote.tradeProviderTimeUnixMs = providerTime
  }
  isEmpty(): boolean {
    return this.map.size === 0
  }
}
