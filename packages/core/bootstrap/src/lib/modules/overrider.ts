import type { CoinsResponse, OverrideRecord } from '../../types'
import { AdapterConfigError, AdapterInputError, AdapterOverriderError } from './error'
import { logger } from './logger'

export class Overrider {
  adapterName: string
  adapterOverrides: AdapterOverrides
  internalOverrides: OverrideRecord
  inputOverrides: OverrideRecord

  constructor(
    internalOverrides: unknown,
    inputOverrides: unknown,
    adapterName: string,
    jobRunID: string,
  ) {
    internalOverrides = internalOverrides || {}
    inputOverrides = inputOverrides || {}
    if (!Overrider.isOverrideObj(internalOverrides))
      throw new AdapterConfigError({
        jobRunID,
        statusCode: 400,
        message: 'Overrider: Internal overrides are invalid.',
      })
    if (!Overrider.isOverrideObj(inputOverrides))
      throw new AdapterInputError({
        jobRunID,
        statusCode: 400,
        message: 'Overrider: Input overrides are invalid.',
      })
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
    overriddenCoins: OverriddenCoins = {},
    remainingSyms: RequestedSymbols,
    coinsResponse: CoinsResponse[],
  ): RequestedCoins => {
    const isConverted: { [symbol: string]: boolean } = {}
    const alreadyWarned: { [symbol: string]: boolean } = {}
    const remainingSymsMap: { [symbol: string]: boolean } = {}
    for (const remainingSym of remainingSyms) {
      remainingSymsMap[remainingSym.toUpperCase()] = true
    }

    for (const coinResponse of coinsResponse) {
      const symbol = coinResponse.symbol.toUpperCase()
      if (!remainingSymsMap[symbol]) continue
      if (!isConverted[symbol] && !overriddenCoins[symbol]) {
        overriddenCoins[symbol] = coinResponse.id
        isConverted[symbol] = true
      } else if (isConverted[symbol] && !alreadyWarned[symbol]) {
        logger.debug(
          `Overrider: The symbol "${coinResponse.symbol}" has a duplicate coin id and no override.`,
        )
        alreadyWarned[symbol] = true
      }
    }

    for (const remainingSym of remainingSyms) {
      if (!isConverted[remainingSym.toUpperCase()]) {
        throw new AdapterOverriderError({
          message: `Overrider: Could not find a matching coin id for the symbol '${remainingSym}'.`,
        })
      }
    }
    return overriddenCoins
  }

  /** Creates an object that maps from the overridden symbol/id
      to the symbol that was originally requested */
  static invertRequestedCoinsObject = (
    requestedCoins: RequestedCoins,
  ): OverrideToOriginalSymbol => {
    const invertedCoinsObject: OverrideToOriginalSymbol = {}
    for (const [symbol, id] of Object.entries(requestedCoins)) {
      invertedCoinsObject[id] = symbol
    }
    return invertedCoinsObject
  }

  static isOverrideObj = (obj: unknown): obj is OverrideRecord => {
    if (typeof obj !== 'object' || Array.isArray(obj)) return false
    const overrideObj = obj as OverrideRecord
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
