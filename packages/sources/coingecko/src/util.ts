import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'

export const getCoinIds = (id: string): Promise<CoinsResponse[]> => {
  return new Promise((resolve, reject) => {
    const execute = makeExecute()
    const executeWithMiddleware = executeSync(execute)
    const options = {
      data: {
        endpoint: 'coins',
      },
      method: 'post',
      id,
    }
    try {
      executeWithMiddleware(options, (_, data) => {
        resolve(data.data)
      })
    } catch (error) {
      reject(error)
    }
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
