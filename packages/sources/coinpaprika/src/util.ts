import { ResponseSchema } from './endpoint/crypto'

export const getCoin = (data: ResponseSchema[], symbol?: string, coinId?: string): ResponseSchema | undefined => {
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
