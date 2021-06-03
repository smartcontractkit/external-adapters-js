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

export const getSymbolToId = (symbol: string, coinList: CoinsResponse[]): string => {
  const isId = coinList.find(({ id }) => id.toLowerCase() === symbol.toLowerCase())
  if (isId && isId.id) return isId.id.toLowerCase()
  const coin = coinList.find(
    ({ symbol: coinSymbol, rank }) =>
      coinSymbol.toLowerCase() === symbol.toLowerCase() && rank !== 0,
  )
  if (coin && coin.id) return coin.id.toLowerCase()
  throw new Error('Coin id not found')
}
