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

export const getSymbolToId = (symbol: string, coinList: CoinsResponse[]): string => {
  const coin = coinList.find(
    ({ symbol: coinSymbol, rank }) =>
      coinSymbol.toLowerCase() === symbol.toLowerCase() && rank !== 0,
  )
  if (coin && coin.id) return coin.id.toLowerCase()
  throw new Error('Coin id not found')
}
