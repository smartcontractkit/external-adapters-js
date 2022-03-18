import type { CoinsResponse } from '@chainlink/types'

export class Overrider {
  adapterName: string
  adapterOverrides: AdapterOverrides
  internalOverrides: OverrideObj
  inputOverrides: OverrideObj

  constructor(internalOverrides: unknown, inputOverrides: unknown, adapterName: string) {
    internalOverrides = internalOverrides || {}
    inputOverrides = inputOverrides || {}
    if (!Overrider.isOverrideObj(internalOverrides)) throw Error('Internal overrides are invalid.')
    if (!Overrider.isOverrideObj(inputOverrides)) throw Error('Input overrides are invalid.')
    this.internalOverrides = internalOverrides
    this.inputOverrides = inputOverrides
    this.adapterName = adapterName.toLowerCase()
    this.adapterOverrides = this.combineOverrides(
      internalOverrides?.[this.adapterName] || {},
      inputOverrides?.[this.adapterName] || {},
    )
  }

  performOverrides = (requestedSymbols: RequestedSymbols): [OverriddenCoins, RemainingSymbols] => {
    const overriddenSyms: OverriddenCoins = {}
    const remainingSyms: RemainingSymbols = []
    const reqSyms = Array.isArray(requestedSymbols) ? requestedSymbols : [requestedSymbols]
    for (const sym of reqSyms) {
      if (this.adapterOverrides[sym]) overriddenSyms[sym] = this.adapterOverrides[sym]
      else remainingSyms.push(sym)
    }
    return [overriddenSyms, remainingSyms]
  }

  static convertRemainingSymbolsToIds = (
    overriddenCoins: OverriddenCoins,
    remainingSyms: RequestedSymbols,
    coinsResponse: CoinsResponse[],
  ): RequestedCoins => {
    const requestedCoins = overriddenCoins || {}
    const isConverted: { [symbol: string]: boolean } = {}
    for (const coinResponse of coinsResponse) {
      if (remainingSyms.includes(coinResponse.symbol)) {
        if (isConverted[coinResponse.symbol])
          throw Error(
            `The symbol '${coinResponse.symbol}' has a duplicate coin id and no override.`,
          )
        else isConverted[coinResponse.symbol] = true
        if (requestedCoins[coinResponse.symbol])
          throw Error(`The symbol '${coinResponse.symbol}' has already been overridden.`)
        requestedCoins[coinResponse.symbol] = coinResponse.id
      }
    }
    for (const remainingSym of remainingSyms) {
      if (!isConverted[remainingSym])
        throw Error(`Could not find a matching coin id for the symbol '${remainingSym}'.`)
    }
    return requestedCoins
  }

  // Creates an object that maps from the overridden symbol/id
  // to the symbol that was originally requested
  static invertRequestedCoinsObject = (
    requestedCoins: RequestedCoins,
  ): OverrideToOriginalSymbol => {
    const invertedCoinsObject: OverrideToOriginalSymbol = {}
    for (const [symbol, id] of Object.entries(requestedCoins)) {
      invertedCoinsObject[id] = symbol
    }
    return invertedCoinsObject
  }

  static isOverrideObj = (obj: unknown): obj is OverrideObj => {
    if (typeof obj !== 'object' || Array.isArray(obj)) return false
    const overrideObj = obj as OverrideObj
    for (const adapterName of Object.keys(overrideObj)) {
      if (typeof adapterName !== 'string') return false
      const adapterOverrides = overrideObj[adapterName]
      if (typeof adapterOverrides !== 'object' || Array.isArray(adapterOverrides)) return false
      for (const symbol of Object.keys(adapterOverrides)) {
        if (typeof symbol !== 'string' || typeof adapterOverrides[symbol] !== 'string') return false
      }
    }
    return true
  }

  private combineOverrides = (
    internalOverrides: AdapterOverrides,
    inputOverrides: AdapterOverrides,
  ): AdapterOverrides => {
    const combinedOverrides = internalOverrides || {}
    for (const symbol of Object.keys(inputOverrides)) {
      combinedOverrides[symbol] = inputOverrides[symbol]
    }
    return combinedOverrides
  }
}

type AdapterOverrides = {
  [symbol: string]: string
}

type OverrideObj = {
  [adapterName: string]: AdapterOverrides
}

type OverriddenCoins = {
  [symbol: string]: string
}

type RequestedCoins = {
  [symbol: string]: string
}

export type OverrideToOriginalSymbol = {
  [id: string]: string
}

type RequestedSymbols = string | string[]

type RemainingSymbols = string[]
