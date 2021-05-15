import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'

export function getCoinIds(id: string): Promise<CoinsResponse[]> {
  const execute = makeExecute()
  const executeWithMiddleware = executeSync(execute)
  const options = {
    data: {
      endpoint: 'coins',
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

/**
 * A map containing IDs that are lower in rank,
 * but should take precedence over higher ranked coins
 *
 * NOTE: this is a kludge that will be removed with overrides improvement
 */
const directIds: { [key: string]: string } = {
  cream: 'cream-cream',
}

export const getSymbolToId = (symbol: string, coinList: CoinsResponse[]): string => {
  if (directIds[symbol.toLowerCase()]) return directIds[symbol.toLowerCase()]

  const coin = coinList.find(
    ({ symbol: coinSymbol, rank }) =>
      coinSymbol.toLowerCase() === symbol.toLowerCase() && rank !== 0,
  )
  if (coin && coin.id) return coin.id.toLowerCase()

  throw new Error('Coin id not found')
}
