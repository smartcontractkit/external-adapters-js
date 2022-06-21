import { endpointSelector, makeExecute } from './adapter'
import { makeMiddleware, withMiddleware } from '@chainlink/ea-bootstrap'
import { AdapterContext, CoinsResponse, Config } from '@chainlink/ea-bootstrap'
import * as endpoints from './endpoint'

export function getCoinIds(context: AdapterContext, id: string): Promise<CoinsResponse[]> {
  const execute = makeExecute()
  const options = {
    data: {
      endpoint: 'coins',
      maxAge: 60 * 60 * 1000, // 1 hour
      market: '',
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware<Config, endpoints.TInputParameters>(
      execute,
      undefined,
      endpointSelector,
    )
    withMiddleware<endpoints.TInputParameters>(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context)
          .then((value) => resolve(value.data as unknown as CoinsResponse[]))
          .catch(reject)
      })
      .catch((error) => reject(error))
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
