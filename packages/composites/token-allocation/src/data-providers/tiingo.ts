import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export interface ResponseSchema {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  priceData: {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    volumeNotional: number
    fxOpen: number
    fxHigh: number
    fxLow: number
    fxClose: number
    fxVolumeNotional: number
    fxRate: number
    tradesDone: number
  }[]
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

const getPriceData = async (base: string, quote: string) => {
  const options = {
    url: 'https://api.tiingo.com/tiingo/crypto/prices',
    params: {
      token: util.getRequiredEnv('API_KEY'),
      baseCurrency: base,
      convertCurrency: quote,
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
    },
  }

  const response = await Requester.request(options, customError)
  return Requester.validateResultNumber(response.data as ResponseSchema[], [
    0,
    'priceData',
    0,
    'fxClose',
  ])
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const data = await getPriceData(symbol, quote)
      return [symbol, data]
    }),
  )

  return Object.fromEntries(entries)
}
export const getMarketCaps = () => {
  throw Error('not implemented')
}
