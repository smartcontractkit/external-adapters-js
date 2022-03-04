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
    // Perform overrides using symbolToIdOverridesFromInput
    let overrideResult = this.performSymbolToIdOverrides(
      requestedSymbols,
      'Input',
      this.adapterName,
    )
    let overriddenCoins = overrideResult[0]
    let remainingSymbols = overrideResult[1]
    overriddenCoinsArr.push(overriddenCoins)

    // Override symbols using symbolToSymbolOverridesFromInput, then retry converting from
    // symbols to ids using symbolToIdOverridesFromInput and symbolToIdOverridesFromAdapter.
    let overriddenSymbols = this.performSymbolToSymbolOverrides(
      remainingSymbols,
      'Input',
      this.adapterName,
    )
    overrideResult = this.performSymbolToIdOverrides(overriddenSymbols, 'Input', this.adapterName)
    overriddenCoins = overrideResult[0]
    remainingSymbols = overrideResult[1]
    overriddenCoinsArr.push(overriddenCoins)
    overrideResult = this.performSymbolToIdOverrides(remainingSymbols, 'Adapter', this.adapterName)
    overriddenCoins = overrideResult[0]
    remainingSymbols = overrideResult[1]
    overriddenCoinsArr.push(overriddenCoins)

    // Finally, perform symbol to symbol overrides from input, then retry overriding from
    // symbols to ids using symbolToIdOverridesFromInput and symbolToIdOverridesFromAdapter.
    overriddenSymbols = this.performSymbolToSymbolOverrides(
      remainingSymbols,
      'Adapter',
      this.adapterName,
    )
    overrideResult = this.performSymbolToIdOverrides(overriddenSymbols, 'Input', this.adapterName)
    overriddenCoins = overrideResult[0]
    remainingSymbols = overrideResult[1]
    overriddenCoinsArr.push(overriddenCoins)
    overrideResult = this.performSymbolToIdOverrides(remainingSymbols, 'Adapter', this.adapterName)
    overriddenCoins = overrideResult[0]
    remainingSymbols = overrideResult[1]
    overriddenCoinsArr.push(overriddenCoins)

    const requestedCoins = this.joinOverriddenCoins(overriddenCoinsArr)
    return [requestedCoins, remainingSymbols]
  }

  private joinOverriddenCoins = (requestedCoinsArr: RequestedCoins[]): RequestedCoins => {
    const combinedCoins: RequestedCoins = {}
    const coinIdsUsed: string[] = []
    for (const requestedCoins of requestedCoinsArr) {
      for (const requestedCoinSymbol of Object.keys(requestedCoins)) {
        const requestedCoinIds = requestedCoins[requestedCoinSymbol]
        // Check to ensure no duplicate coin ids are included in a request
        if (coinIdsUsed.some((id) => requestedCoinIds.includes(id)))
          throw Error('A duplicate coin id was requested.')
        coinIdsUsed.concat(requestedCoinIds)
        if (!combinedCoins[requestedCoinSymbol])
          combinedCoins[requestedCoinSymbol] = requestedCoinIds
        else combinedCoins[requestedCoinSymbol].concat(requestedCoinIds)
      }
    }
    return combinedCoins
  }

  convertRemainingSymbolsToIds = (
    symbols: string[],
    coinsResponses: CoinsResponse[],
    requestedCoins: RequestedCoins,
  ): RequestedCoins => {
    for (let i = 0; i < symbols.length; i++) {
      let isDuplicatedSymbol = false
      let foundMatch = false
      for (const coinsResponse of coinsResponses) {
        if (coinsResponse.symbol === symbols[i]) {
          if (isDuplicatedSymbol)
            throw new AdapterError({
              message: `An overlapping coin id was found for the requested symbol '${coinsResponse.symbol}' and no override was provided.`,
            })
          if (Object.values(requestedCoins).flat().includes(coinsResponse.id))
            throw new AdapterError({
              message: `The coin id '${coinsResponse.id}' was duplicated in the request.`,
            })
          if (requestedCoins[coinsResponse.symbol])
            requestedCoins[coinsResponse.symbol].push(coinsResponse.id)
          else requestedCoins[coinsResponse.symbol] = [coinsResponse.id]
          foundMatch = true
          isDuplicatedSymbol = true
        }
      }
      if (!foundMatch)
        throw new AdapterError({
          message: `Could not find a coin id for the requested symbol '${symbols[i]}'`,
        })
    }
    return requestedCoins
  }

  // Creates a record where the coin id are the key and the symbol is the value
  static invertRequestedCoinsObject = (requestedCoins: RequestedCoins): Record<string, string> => {
    const invertedCoinsObject: Record<string, string> = {}
    for (const [symbol, ids] of Object.entries(requestedCoins)) {
      for (const id of ids) {
        invertedCoinsObject[id] = symbol
      }
    }
    return invertedCoinsObject
  }

  private performSymbolToIdOverrides = (
    requestedSymbols: string[],
    overrideSource: 'Input' | 'Adapter',
    adapterName: string,
  ): [RequestedCoins, string[]] => {
    const requestedCoins: RequestedCoins = {}
    const symbolToIdOverrides = this.validated[`symbolToIdOverridesFrom${overrideSource}`]?.get(
      adapterName.toLowerCase(),
    )
    const remainingSymbols: string[] = []
    if (symbolToIdOverrides) {
      for (const requestedSymbol of requestedSymbols) {
        const overridingId = symbolToIdOverrides.get(requestedSymbol)
        if (overridingId) {
          if (!requestedCoins[requestedSymbol]) requestedCoins[requestedSymbol] = [overridingId]
          else requestedCoins[requestedSymbol].push(overridingId)
        } else {
          remainingSymbols.push(requestedSymbol)
        }
      }
    }
    return [requestedCoins, remainingSymbols]
  }

  private performSymbolToSymbolOverrides = (
    requestedSymbols: string[],
    overrideSource: 'Input' | 'Adapter',
    adapterName: string,
  ): string[] => {
    const symbolToSymbolOverrides = this.validated[
      `symbolToSymbolOverridesFrom${overrideSource}`
    ]?.get(adapterName.toLowerCase())
    if (symbolToSymbolOverrides) {
      for (let i = 0; i < requestedSymbols.length; i++) {
        const requestedSymbol = requestedSymbols[i]
        const overridingSymbol = symbolToSymbolOverrides.get(requestedSymbol)
        if (overridingSymbol) requestedSymbols[i] = overridingSymbol
      }
    }
    return requestedSymbols
  }
}
