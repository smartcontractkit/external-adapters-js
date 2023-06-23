import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { BaseEndpointTypes, cryptoInputParams } from '../endpoint/utils'

export const logger = makeLogger('CryptoCompare HTTP')

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

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderCryptoResponseBody
  }
}

// Cryptocompare has limits for `fsyms` and `tsyms` query params. 1000 characters for `fsyms` and 100 for `tsyms`. We create N number of chunks based on actual lengths of params.
const chunkByParamsLength = (
  params: (typeof cryptoInputParams.validated)[],
  maxBatchBaseLength = 200,
  maxBatchQuoteLength = 100,
) => {
  const uniqueParams: { bases: string[]; quotes: string[] } = { bases: [], quotes: [] }
  const result: (typeof cryptoInputParams.validated)[][] = []
  let temp: (typeof cryptoInputParams.validated)[] = []
  const TICKER_MAX_LENGTH = 5
  params.forEach((pair) => {
    // Here we assume that the maximum ticker size is 5. We subtract it to be safe that we don't exceed the limit even when the last ticker has the maximum allowed length.  We also subtract the last comma.
    const baseLimit = maxBatchBaseLength - TICKER_MAX_LENGTH - 1
    const quoteLimit = maxBatchQuoteLength - TICKER_MAX_LENGTH - 1

    // If we are over limit for either base or quote we save those in result and clean current values for next iteration
    if (
      uniqueParams.quotes.join(',').length > baseLimit ||
      uniqueParams.bases.join(',').length > quoteLimit
    ) {
      result.push(temp)
      uniqueParams.bases = []
      uniqueParams.quotes = []
      temp = []
    }

    if (!uniqueParams.quotes.includes(pair.quote.toUpperCase())) {
      uniqueParams.quotes.push(pair.quote.toUpperCase())
    }

    if (!uniqueParams.bases.includes(pair.base.toUpperCase())) {
      uniqueParams.bases.push(pair.base.toUpperCase())
    }

    temp.push(pair)
  })
  // Add remaining params to the result (this will always be lower than actual limits)
  result.push(temp)

  return result
}

export const buildBatchedRequestBody = (
  params: (typeof cryptoInputParams.validated)[],
  settings: typeof config.settings,
) => {
  const chunkedMatrix = chunkByParamsLength(params)

  return chunkedMatrix.map((cParams) => {
    return {
      params: cParams,
      request: {
        baseURL: settings.API_ENDPOINT,
        url: '/data/pricemultifull',
        headers: {
          authorization: `Apikey ${settings.API_KEY}`,
        },
        params: {
          fsyms: [...new Set(cParams.map((p) => p.base.toUpperCase()))].join(','),
          tsyms: [...new Set(cParams.map((p) => p.quote.toUpperCase()))].join(','),
        },
      },
    }
  })
}

const errorResponse = (payload: typeof cryptoInputParams.validated, message?: string) => {
  return {
    params: payload,
    response: {
      statusCode: 400,
      errorMessage:
        message ||
        'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
    },
  }
}

export const constructEntry = (
  requestPayload: typeof cryptoInputParams.validated,
  res: ProviderCryptoResponseBody,
  resultPath: keyof Pick<ProviderCryptoQuoteData, 'PRICE' | 'MKTCAP' | 'VOLUME24HOURTO'>,
) => {
  const dataForCoin = res.RAW[requestPayload.base.toUpperCase()]
  if (!dataForCoin) {
    const message = `Data for "${requestPayload.base}" not found`
    logger.warn(message)
    return errorResponse(requestPayload, message)
  }

  const dataForQuote = dataForCoin[requestPayload.quote.toUpperCase()]
  if (!dataForQuote) {
    const message = `"${requestPayload.quote}" quote for "${requestPayload.base}" not found`
    logger.warn(message)
    return errorResponse(requestPayload, message)
  }

  const value = dataForQuote[resultPath]
  if (!value) {
    const message = `No result for "${resultPath}" found for "${requestPayload.base}/${requestPayload.quote}"`
    logger.warn(message)
    return errorResponse(requestPayload, message)
  }

  return {
    params: requestPayload,
    response: {
      result: value,
      data: {
        result: value,
      },
    },
  }
}
