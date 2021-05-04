import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'

export const getCoinIds = (id: string): Promise<CoinsResponse> => {
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
    console.log(options)
    try {
      executeWithMiddleware(options, (_, data) => {
        resolve(data.data)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export const getSymbolToId = (symbol: string, coinList: CoinsResponse): string => {
  coinList.sort((a: { rank: number }, b: { rank: number }) => (a.rank > b.rank ? 1 : -1))
  const coin = coinList.find(
    (x: { symbol: string; rank: number }) =>
      x.symbol.toLowerCase() === symbol.toLowerCase() && x.rank !== 0,
  )
  if (coin && coin.id) return coin.id.toLowerCase()
  throw new Error('Coin id not found')
}
