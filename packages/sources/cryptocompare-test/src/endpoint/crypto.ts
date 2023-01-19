import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import {
  ProviderCryptoQuoteData,
  ProviderCryptoResponseBody,
  CryptoEndpointParams,
  cryptoEndpointInputParams,
  endpoints,
} from '../crypto-utils'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings, defaultEndpoint } from '../config'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './crypto-ws'

const logger = makeLogger('CryptoCompare HTTP')

type BatchEndpointTypes = {
  Request: {
    Params: CryptoEndpointParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderCryptoResponseBody
  }
}

export const buildBatchedRequestBody = (
  params: CryptoEndpointParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  return {
    params,
    request: {
      baseURL: config.API_ENDPOINT,
      url: '/data/pricemultifull',
      headers: {
        authorization: `Apikey ${config.API_KEY}`,
      },
      params: {
        fsyms: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
        tsyms: [...new Set(params.map((p) => p.quote.toUpperCase()))].join(','),
      },
    },
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

const errorResponse = (payload: CryptoEndpointParams, message?: string) => {
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
  requestPayload: CryptoEndpointParams,
  res: ProviderCryptoResponseBody,
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

  const resultKey = endpointResultPaths[requestPayload.endpoint || defaultEndpoint]
  const value = dataForQuote[resultKey]
  if (!value) {
    const message = `No result for "${resultKey}" found for "${requestPayload.base}/${requestPayload.quote}"`
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

const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = []
    for (const requestPayload of params) {
      const entry = constructEntry(requestPayload, res.data)
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})

export const routingTransport = new RoutingTransport<BatchEndpointTypes>(
  {
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: defaultEndpoint,
  aliases: endpoints,
  transport: routingTransport,
  inputParameters: cryptoEndpointInputParams,
})
