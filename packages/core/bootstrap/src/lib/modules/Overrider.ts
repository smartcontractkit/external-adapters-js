import type { Validated, RequestedCoins, CoinsResponse } from '@chainlink/types'
import { AdapterError } from './error'

export class Overrider {
  adapterName: string

  constructor(public validated: Validated, adapterName: string) {
    this.adapterName = adapterName.toLowerCase()
  }

  performOverrides = (requestedSymbols: string | string[]): [RequestedCoins, string[]] => {
    requestedSymbols = Array.isArray(requestedSymbols) ? requestedSymbols : [requestedSymbols]
    const overriddenCoinsArr: RequestedCoins[] = []

    const symbolToIdOverrideFrom =
      (source: 'Input' | 'Adapter') => (remainingSymbols: string[]) => {
        const overrideResult = this.performSymbolToIdOverrides(remainingSymbols, source)
        const overriddenCoins = overrideResult[0]
        remainingSymbols = overrideResult[1]
        overriddenCoinsArr.push(overriddenCoins)
        return remainingSymbols
      }
    const symbolToSymbolOverrideFrom =
      (source: 'Input' | 'Adapter') =>
      (remainingSymbols: string[]): string[] => {
        return this.performSymbolToSymbolOverrides(remainingSymbols, source)
      }

    const overrideActions = [
      symbolToIdOverrideFrom('Input'),
      symbolToSymbolOverrideFrom('Input'),
      symbolToIdOverrideFrom('Input'),
      symbolToIdOverrideFrom('Adapter'),
      symbolToSymbolOverrideFrom('Adapter'),
      symbolToIdOverrideFrom('Input'),
      symbolToIdOverrideFrom('Adapter'),
    ]
    let remainingSymbols = requestedSymbols
    overrideActions.forEach(
      (performOverride) => (remainingSymbols = performOverride(remainingSymbols)),
    )

    const requestedCoins = this.joinOverriddenCoins(overriddenCoinsArr)
    return [requestedCoins, remainingSymbols]
  }

  // The first instance of a requestedCoin in the requestedCoinsArr takes precendence
  // if there is a duplicate when combining.
  private joinOverriddenCoins = (requestedCoinsArr: RequestedCoins[]): RequestedCoins => {
    const combinedRequestedCoins: RequestedCoins = {}
    for (const requestedCoins of requestedCoinsArr) {
      for (const [symbol, id] of Object.entries(requestedCoins)) {
        if (!combinedRequestedCoins[symbol]) {
          if (Object.values(combinedRequestedCoins).includes(id))
            throw Error(
              `A duplicate was detected in the requested coin ids (existing id '${combinedRequestedCoins[symbol]}' new id '${id}').`,
            )
          else combinedRequestedCoins[symbol] = id
        }
      }
    }
    return combinedRequestedCoins
  }

  convertRemainingSymbolsToIds = (
    remainingSymbols: string[],
    symbolsAndIdsFromDataProvider: CoinsResponse[],
    requestedCoins: RequestedCoins,
  ): RequestedCoins => {
    for (let i = 0; i < remainingSymbols.length; i++) {
      let isDuplicatedSymbol = false
      let foundMatch = false
      for (const coinsResponse of symbolsAndIdsFromDataProvider) {
        if (coinsResponse.symbol === remainingSymbols[i]) {
          if (isDuplicatedSymbol)
            throw new AdapterError({
              message: `An overlapping coin id was found for the requested symbol '${coinsResponse.symbol}' and no override was provided.`,
            })
          if (Object.values(requestedCoins).includes(coinsResponse.id))
            throw new AdapterError({
              message: `The coin id '${coinsResponse.id}' was duplicated in the request.`,
            })
          if (!requestedCoins[coinsResponse.symbol])
            requestedCoins[coinsResponse.symbol] = coinsResponse.id
          else
            throw new AdapterError({
              message: `The coin id '${
                requestedCoins[coinsResponse.symbol]
              }' already exists for the symbol '${coinsResponse.symbol}'.'`,
            })
          foundMatch = true
          isDuplicatedSymbol = true
        }
      }
      if (!foundMatch)
        throw new AdapterError({
          message: `Could not find a coin id for the requested symbol '${remainingSymbols[i]}'`,
        })
    }
    return requestedCoins
  }

  // Creates a record where the coin id are the key and the symbol is the value
  static invertRequestedCoinsObject = (requestedCoins: RequestedCoins): Record<string, string> => {
    const invertedCoinsObject: Record<string, string> = {}
    for (const [symbol, id] of Object.entries(requestedCoins)) {
      invertedCoinsObject[id] = symbol
    }
    return invertedCoinsObject
  }

  private performSymbolToIdOverrides = (
    requestedSymbols: string[],
    overrideSource: 'Input' | 'Adapter',
  ): [RequestedCoins, string[]] => {
    const requestedCoins: RequestedCoins = {}
    const symbolToIdOverrides = this.validated[`symbolToIdOverridesFrom${overrideSource}`]?.get(
      this.adapterName,
    )
    const remainingSymbols: string[] = []

    if (symbolToIdOverrides) {
      for (const requestedSymbol of requestedSymbols) {
        if (symbolToIdOverrides.has(requestedSymbol))
          requestedCoins[requestedSymbol] = symbolToIdOverrides.get(requestedSymbol)
        else remainingSymbols.push(requestedSymbol)
      }
      return [requestedCoins, remainingSymbols]
    }
    return [requestedCoins, requestedSymbols]
  }

  private performSymbolToSymbolOverrides = (
    requestedSymbols: string[],
    overrideSource: 'Input' | 'Adapter',
  ): string[] => {
    const symbolToSymbolOverrides = this.validated[`symbolToSymbolOverridesFrom${overrideSource}`]
    if (symbolToSymbolOverrides?.has(this.adapterName)) {
      for (let i = 0; i < requestedSymbols.length; i++) {
        const requestedSymbol = requestedSymbols[i]
        const overridingSymbol = symbolToSymbolOverrides.get(requestedSymbol)
        if (overridingSymbol) requestedSymbols[i] = overridingSymbol
      }
    }
    return requestedSymbols
  }
}
