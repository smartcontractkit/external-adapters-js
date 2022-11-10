import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'

const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
  interval: {
    required: false,
    description:
      'The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly',
    default: '2m',
  },
  millisecondsAgo: {
    required: false,
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: 86_400_000, // 24 hours
  },
  sort: {
    required: false,
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
} as const

type EndpointTypes = {
  Request: {
    Params: EmptyObject
  }
  Response: {
    Data: any
    Result: null
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: never
    ResponseBody: any
  }
}

const restEndpointTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (_, config) => {
    return {
      baseURL: config.API_ENDPOINT,
    }
  },
  parseResponse: (_, res) => {
    return {
      data: res.data,
      statusCode: 200,
      result: null,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'trades',
  transport: restEndpointTransport,
  inputParameters,
})
