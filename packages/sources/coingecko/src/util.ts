import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'

export function getCoinIds(id: string): Promise<CoinsResponse[]> {
  const execute = makeExecute()
  const executeWithMiddleware = executeSync(execute)
  const options = {
    data: {
      endpoint: 'coins',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
    method: 'post',
    id,
  }
  return new Promise((resolve, reject) => {
    executeWithMiddleware(options, (_, result) => {
      if (result.error) {
        reject(result)
      } else {
        resolve(result.data)
      }
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
      idToSymbol[coin.id] = symbol
    }
  })
  return idToSymbol
}
