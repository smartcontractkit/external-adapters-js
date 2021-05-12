import { Config } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'

type CoinsListResponse = {
  id: string
  symbol: string
  name: string
}[]

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export const getCoinIds = async (config: Config): Promise<CoinsListResponse> => {
  const url = '/coins/list'
  const options = {
    ...config.api,
    url,
  }
  return (await Requester.request(options, customError)).data as CoinsListResponse
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
