import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'

type CoinsListResponse = {
  id: string
  symbol: string
  name: string
}[]

export const getCoinIds = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const execute = makeExecute()
    const executeWithMiddleware = executeSync(execute)
    const options = {
      data: {
        endpoint: 'coins',
      },
      method: 'post',
      id: '1',
    }
    try {
      executeWithMiddleware(options, (_, data) => {
        console.log(data)
        resolve(data.data)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export const getSymbolsToIds = (
  symbols: string[],
  coinList: CoinsListResponse,
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
