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
  private readonly map = new Map<string, Map<string, Quote>>()

  isEmpty(): boolean {
    return this.map.size === 0
  }

  hasMarket(market: string): boolean {
    const bucket = this.map.get(market)
    return !!bucket && bucket.size > 0
  }

  getMarkets(): string[] {
    return [...this.map].flatMap(([market, bucket]) => (bucket.size ? [market] : []))
  }

  activate(market: string, isin: string) {
    let marketMap = this.map.get(market)
    if (!marketMap) {
      marketMap = new Map<string, Quote>()
      this.map.set(market, marketMap)
    }
    if (!marketMap.has(isin)) marketMap.set(isin, {})
  }

  deactivate(market: string, isin: string) {
    const marketMap = this.map.get(market)
    if (!marketMap) {
      return
    }
    marketMap.delete(isin)
    if (marketMap.size === 0) {
      this.map.delete(market)
    }
  }

  has(market: string, isin: string): boolean {
    return this.map.get(market)?.has(isin) ?? false
  }

  get(market: string, isin: string): Quote | undefined {
    return this.map.get(market)?.get(isin)
  }

  addQuote(
    market: string,
    isin: string,
    bid: number,
    ask: number,
    providerTime: number,
    bidSz: number,
    askSz: number,
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
      quote.mid = new Decimal(bid).plus(quote.ask).div(2).toNumber()
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
      quote.mid = new Decimal(quote.bid).plus(ask).div(2).toNumber()
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
}
