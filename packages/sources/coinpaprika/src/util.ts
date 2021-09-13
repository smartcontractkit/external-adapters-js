import { makeExecute } from './adapter'
import { makeMiddleware, withMiddleware } from '@chainlink/ea-bootstrap'
import { ResponseSchema } from './endpoint/crypto'
import { CoinsResponse } from './endpoint/coins'
import { AdapterContext } from '@chainlink/types'

export const getCoin = (
  data: ResponseSchema[],
  symbol?: string,
  coinId?: string,
): ResponseSchema | undefined => {
  data.sort((a, b) => a.rank - b.rank)
  if (coinId) {
    return data.find(({ id }) => id.toLowerCase() === coinId.toLowerCase())
  } else if (symbol) {
    return data.find(
      ({ symbol: coinSymbol, rank }) =>
        coinSymbol.toLowerCase() === symbol.toLowerCase() && rank !== 0,
    )
  }
  return undefined
}

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
  return new Promise((resolve, reject) => {
    const middleware = makeMiddleware(execute)
    withMiddleware(execute, context, middleware)
      .then((executeWithMiddleware) => {
        executeWithMiddleware(options, context).then((value) => resolve(value.data))
      })
      .catch((error) => reject(error))
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
