import { HttpRequestConfig, HttpResponse } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint, PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { BatchWarmingTransport } from '@chainlink/external-adapter-framework/transports/batch-warming'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import {
  ProviderCryptoQuoteData,
  ProviderCryptoResponseBody,
  CryptoEndpointTypes,
  CryptoEndpointParams,
  cryptoEndpointInputParams,
  endpoints,
} from '../crypto-utils'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings, defaultEndpoint } from '../config'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/routing'
import { wsTransport } from './crypto-ws'

const logger = makeLogger('CryptoCompare HTTP')

type BatchEndpointTypes = CryptoEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderCryptoResponseBody
  }
}

export const buildBatchedRequestBody = (
  params: PriceEndpointParams[],
  config: AdapterConfig<typeof customSettings>,
): HttpRequestConfig<never> => {
  return {
    baseURL: config.API_ENDPOINT,
    url: '/data/pricemultifull',
    method: 'GET',
    headers: {
      authorization: `Apikey ${config.API_KEY}`,
    },
    params: {
      fsyms: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
      tsyms: [...new Set(params.map((p) => p.quote.toUpperCase()))].join(','),
    },
  }
}

interface ResultEntry {
  value: number
  params: CryptoEndpointParams
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

const batchEndpointTransport = new BatchWarmingTransport<BatchEndpointTypes>({
  prepareRequest: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = [] as ProviderResult<BatchEndpointTypes>[]
    for (const requestPayload of params) {
      const entry = constructEntry(res, requestPayload)
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const routingTransport = new RoutingTransport<CryptoEndpointTypes>(
  {
    HTTP: batchEndpointTransport,
    WS: wsTransport,
  },
  (req) => {
    if (req.requestContext.data.endpoint === 'crypto-ws') {
      return 'WS'
    }
    return 'HTTP'
  },
)

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: defaultEndpoint,
  aliases: endpoints,
  transport: routingTransport,
  inputParameters: cryptoEndpointInputParams,
})
