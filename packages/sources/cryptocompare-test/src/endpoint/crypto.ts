import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { cryptoInputParams } from '../crypto-utils'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { DEFAULT_API_ENDPOINT, defaultEndpoint } from '../config'

const logger = makeLogger('CryptoCompare Crypto')

const cryptoEndpointInputParams = {
  ...cryptoInputParams,
  endpoint: {
    default: defaultEndpoint,
    type: 'string',
  },
} as const

export type CryptoEndpointParams = PriceEndpointParams & {
  endpoint?: string
}

export interface ProviderCryptoQuoteData {
  TYPE: string
  MARKET: string
  FROMSYMBOL: string
  TOSYMBOL: string
  FLAGS: string
  PRICE: number
  LASTUPDATE: number
  MEDIAN: number
  LASTVOLUME: number
  LASTVOLUMETO: number
  LASTTRADEID: string
  VOLUMEDAY: number
  VOLUMEDAYTO: number
  VOLUME24HOUR: number
  VOLUME24HOURTO: number
  OPENDAY: number
  HIGHDAY: number
  LOWDAY: number
  OPEN24HOUR: number
  HIGH24HOUR: number
  LOW24HOUR: number
  LASTMARKET: string
  VOLUMEHOUR: number
  VOLUMEHOURTO: number
  OPENHOUR: number
  HIGHHOUR: number
  LOWHOUR: number
  TOPTIERVOLUME24HOUR: number
  TOPTIERVOLUME24HOURTO: number
  CHANGE24HOUR: number
  CHANGEPCT24HOUR: number
  CHANGEDAY: number
  CHANGEPCTDAY: number
  CHANGEHOUR: number
  CHANGEPCTHOUR: number
  CONVERSIONTYPE: string
  CONVERSIONSYMBOL: string
  SUPPLY: number
  MKTCAP: number
  MKTCAPPENALTY: number
  TOTALVOLUME24H: number
  TOTALVOLUME24HTO: number
  TOTALTOPTIERVOLUME24H: number
  TOTALTOPTIERVOLUME24HTO: number
  IMAGEURL: string
}

export interface ProviderCryptoResponseBody {
  RAW: {
    [fsym: string]: {
      [tsym: string]: ProviderCryptoQuoteData
    }
  }
  DISPLAY: {
    [fsym: string]: {
      [tsym: string]: {
        FROMSYMBOL: string
        TOSYMBOL: string
        MARKET: string
        PRICE: string
        LASTUPDATE: string
        LASTVOLUME: string
        LASTVOLUMETO: string
        LASTTRADEID: string
        VOLUMEDAY: string
        VOLUMEDAYTO: string
        VOLUME24HOUR: string
        VOLUME24HOURTO: string
        OPENDAY: string
        HIGHDAY: string
        LOWDAY: string
        OPEN24HOUR: string
        HIGH24HOUR: string
        LOW24HOUR: string
        LASTMARKET: string
        VOLUMEHOUR: string
        VOLUMEHOURTO: string
        OPENHOUR: string
        HIGHHOUR: string
        LOWHOUR: string
        TOPTIERVOLUME24HOUR: string
        TOPTIERVOLUME24HOURTO: string
        CHANGE24HOUR: string
        CHANGEPCT24HOUR: string
        CHANGEDAY: string
        CHANGEPCTDAY: string
        CHANGEHOUR: string
        CHANGEPCTHOUR: string
        CONVERSIONTYPE: string
        CONVERSIONSYMBOL: string
        SUPPLY: string
        MKTCAP: string
        MKTCAPPENALTY: string
        TOTALVOLUME24H: string
        TOTALVOLUME24HTO: string
        TOTALTOPTIERVOLUME24H: string
        TOTALTOPTIERVOLUME24HTO: string
        IMAGEURL: string
      }
    }
  }
}

export const buildBatchedRequestBody = (
  params: PriceEndpointParams[],
  config: AdapterConfig,
): HttpRequestConfig<never> => {
  return {
    baseURL: DEFAULT_API_ENDPOINT,
    url: '/data/pricemultifull',
    method: 'GET',
    headers: {
      authorization: `Apikey ${config.apiKey}`,
    },
    params: {
      fsyms: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
      tsyms: [...new Set(params.map((p) => p.quote.toUpperCase()))].join(','),
    },
  }
}

interface ResultEntry {
  value: number
  params: {
    quote: string
    base: string
  }
}

type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: unknown
}

const endpointResultPaths: { [endpoint: string]: KeyOfType<ProviderCryptoQuoteData, number> } = {
  crypto: 'PRICE',
  price: 'PRICE',
  marketcap: 'MKTCAP',
  volume: 'VOLUME24HOURTO',
}

export const constructEntry = (
  res: HttpResponse<ProviderCryptoResponseBody>,
  requestPayload: CryptoEndpointParams,
): ResultEntry | undefined => {
  const dataForCoin = res.data.RAW[requestPayload.base.toUpperCase()]
  if (!dataForCoin) {
    logger.warn(`Data for "${requestPayload.base}" not found`)
    return
  }

  const dataForQuote = dataForCoin[requestPayload.quote.toUpperCase()]
  if (!dataForQuote) {
    logger.warn(`"${requestPayload.quote}" quote for "${requestPayload.base}" not found`)
    return
  }

  const resultKey = endpointResultPaths[requestPayload.endpoint || defaultEndpoint]
  const value = dataForQuote[resultKey]
  if (!value) {
    logger.warn(
      `No result for "${resultKey}" found for "${requestPayload.base}/${requestPayload.quote}"`,
    )
    return
  }

  return {
    params: requestPayload,
    value,
  }
}

const batchEndpointTransport = new BatchWarmingTransport({
  prepareRequest: (
    params: CryptoEndpointParams[],
    config: AdapterConfig,
  ): HttpRequestConfig<never> => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (
    params: CryptoEndpointParams[],
    res: HttpResponse<ProviderCryptoResponseBody>,
  ): ProviderResult<CryptoEndpointParams>[] => {
    const entries = [] as ProviderResult<CryptoEndpointParams>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload)
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const endpoint = new PriceEndpoint({
  name: 'crypto',
  aliases: ['price', 'volume', 'marketcap'],
  transport: batchEndpointTransport,
  inputParameters: cryptoEndpointInputParams,
})
