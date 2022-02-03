import { Logger, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [
  // NOTE: Cryptocompare limits by character length of fsyms
  { name: 'base', limit: 200 }, // actual limit: 1000 characters
  { name: 'quote', limit: 20 }, // actual limit: 100 characters
  // TODO handle character length limits
]

export const endpointResultPaths = {
  crypto: 'PRICE',
  price: 'PRICE',
  marketcap: 'MKTCAP',
  volume: 'VOLUME24HOURTO',
}

export interface ResponseSchema {
  RAW: {
    [fsym: string]: {
      [tsym: string]: {
        TYPE: string
        MARKET: string
        FROMSYMBOL: string
        TOSYMBOL: string
        FLAGS: string
        PRICE?: number
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

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema[]>,
  validator: Validator,
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base of request.data.base) {
    const baseWithOverride = (validator.overrideSymbol(AdapterName, base) as string)?.toUpperCase()
    // Skip if the response does not contain the base
    if (!response.data.RAW[baseWithOverride]) {
      Logger.warn(`${baseWithOverride} not found in batch response data`)
      continue
    }
    for (const quote in response.data.RAW[baseWithOverride]) {
      // Skip this pair if CC doesn't have resultPath for this pair
      if (!(resultPath in response.data.RAW[baseWithOverride][quote])) {
        Logger.warn(`${resultPath} not found in batch response data's ${baseWithOverride}.${quote}`)
        continue
      }
      payload.push([
        {
          ...request,
          data: { ...request.data, base: base.toUpperCase(), quote: quote.toUpperCase() },
        },
        Requester.validateResultNumber(response.data, ['RAW', baseWithOverride, quote, resultPath]),
      ])
    }
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `/data/pricemultifull`
  const symbol = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const resultPath = validator.validated.data.resultPath

  const params = {
    fsyms: (Array.isArray(symbol)
      ? symbol.map((s) => s.toUpperCase())
      : [symbol.toUpperCase()]
    ).join(),
    tsyms: (Array.isArray(quote)
      ? quote.map((q) => q.toUpperCase())
      : [quote.toUpperCase()]
    ).join(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)

  if (Array.isArray(symbol) || Array.isArray(quote))
    return handleBatchedRequest(jobRunID, request, response, validator, resultPath)

  const result = Requester.validateResultNumber(response.data, [
    'RAW',
    (symbol as string).toUpperCase(),
    quote,
    resultPath,
  ])

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
