import { Execute } from '@chainlink/types'
import finnhub from '@chainlink/finnhub-adapter'
import fcsapi from '@chainlink/fcsapi-adapter'

export enum PriceDataProvider {
  Finnhub = 'finnhub',
  FCS_API = 'fcsapi',
}

const isPriceDataProvider = (envVar?: string): envVar is PriceDataProvider =>
  Object.values(PriceDataProvider).includes(envVar as any)

export const getPriceDataProvider = (): PriceDataProvider | undefined => {
  const priceDataProvider = process.env.PRICE_ADAPTER
  return isPriceDataProvider(priceDataProvider)
    ? (priceDataProvider as PriceDataProvider)
    : undefined
}

export const getImpl = (type?: PriceDataProvider): Execute => {
  switch (type) {
    case PriceDataProvider.Finnhub:
      return finnhub.makeExecute()
    case PriceDataProvider.FCS_API:
      return fcsapi.makeExecute()
    default:
      throw Error(`Unknown price data provider adapter type: ${type}`)
  }
}
