import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { DEFAULT_API_ENDPOINT } from '../config'
import { validateResultNumber } from '../global-utils'

export interface ResponseSchema {
  data: {
    asset: string
    time: string
    ReferenceRateUSD?: string
    ReferenceRateEUR?: string
  }[]
  error?: {
    type: string
    message: string
  }
}

type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: {
    Data: ResponseSchema | undefined
    Result: number
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const restEndpointTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (input, config) => {
    const { base, quote } = input.requestContext.data
    const metric = `ReferenceRate${quote.toUpperCase()}`
    const params = {
      assets: base,
      metrics: metric,
      frequency: '1s',
      api_key: config.API_KEY,
      page_size: 1,
    }

    return {
      url: `${config.API_ENDPOINT || DEFAULT_API_ENDPOINT}/timeseries/asset-metrics`,
      method: 'GET',
      params,
    }
  },
  parseResponse: (input, res, config) => {
    const { quote } = input.requestContext.data
    const metric = `ReferenceRate${quote.toUpperCase()}`
    const result = validateResultNumber(res.data, metric)

    return {
      data: config.API_VERBOSE ? res.data : undefined,
      providerStatusCode: res.status,
      statusCode: 200,
      result,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: restEndpointTransport,
  inputParameters: priceEndpointInputParameters,
})
