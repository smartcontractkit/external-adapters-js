import { makeExecute } from './adapter'
import { executeSync } from '@chainlink/ea-bootstrap'
import { CoinsResponse } from './endpoint/coins'

const coingeckoBlacklist = [
  'leocoin',
  'farmatrust',
  'freetip',
  'compound-coin',
  'uni-coin',
  'unicorn-token',
  'kyber-network-crystal', // TEMP blacklisted due to no volume
]

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

export const getSymbolsToIds = (
  symbols: string[],
  coinList: CoinsResponse[],
): Record<string, string> => {
  const idToSymbol: Record<string, string> = {
    // Pre-set IDs here
    'kyber-network': 'KNC',
  }

  symbols.forEach((symbol) => {
    const coin = coinList.find(
      (d) =>
        d.symbol.toLowerCase() === symbol.toLowerCase() &&
        !coingeckoBlacklist.includes(d.id.toLowerCase()),
    )
    if (coin && coin.id) {
      idToSymbol[coin.id] = symbol
    }
  })

  return idToSymbol
}
