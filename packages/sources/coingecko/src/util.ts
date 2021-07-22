import { endpointSelector, makeExecute } from './adapter'
import { makeMiddleware, withMiddleware } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'
import { AdapterContext } from '@chainlink/types'

export function getCoinIds(context: AdapterContext, id: string): Promise<CoinsResponse[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'coins',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    method: 'post',
    id,
  }
  return new Promise((resolve) => {
    const middleware = makeMiddleware(execute, undefined, endpointSelector)
    withMiddleware(execute, context, middleware).then((executeWithMiddleware) => {
      return executeWithMiddleware(options, context).then((value) => resolve(value.data))
    })
  })
}

export const getSymbolsToIds = (
  symbols: string[],
  coinList: CoinsResponse[],
): Record<string, string> => {
  const idToSymbol: Record<string, string> = {}
  symbols.forEach((symbol) => {
    const coin = coinList.find((d) => d.symbol.toLowerCase() === symbol.toLowerCase())
    if (coin && coin.id) {
      idToSymbol[coin.id] = coin.symbol
      return
    }
    const byId = coinList.find((d) => d.id.toLowerCase() === symbol.toLowerCase())
    if (byId) {
      idToSymbol[byId.id] = byId.symbol
      return
    }
  })
  return idToSymbol
}
