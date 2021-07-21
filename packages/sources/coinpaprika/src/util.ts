import { makeExecute } from './adapter'
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
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware).then((executeWithMiddleware) => {
      return executeWithMiddleware(options, context).then((value) => resolve(value.data))
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
