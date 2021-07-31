import { AdapterNames } from './'
import { Payload } from './types'

export const httpPayloadsByAdapter: Record<AdapterNames, Payload[]> = {
  nomics: [],
  cryptocompare: [],
  tiingo: [],
  coingecko: [],
  coinapi: [],
  coinmarketcap: [],
}
