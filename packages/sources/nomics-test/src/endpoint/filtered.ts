import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'id'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to query',
  },
  exchanges: {
    required: true,
    type: 'string',
    description: 'Comma delimited list of exchange names',
  },
}

export type FilteredEndpointTypes = {
  Request: {
    Params: {
      base: string
      exchanges: string
    }
  }
  Response: {
    Data: any
    Result: any
  }
  CustomSettings: any
  Provider: {
    RequestBody: any
    ResponseBody: any
  }
}

const restEndpointTransport = new RestTransport<FilteredEndpointTypes>({
  prepareRequest: (p, config) => {
    const baseURL = config.API_ENDPOINT
    const params = {
      currency: p.requestContext.data.base,
      key: config.API_KEY,
      exchanges: p.requestContext.data.exchanges,
    }
    return {
      baseURL,
      url: '/prices/restricted',
      method: 'GET',
      params,
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

export const endpoint = new AdapterEndpoint<FilteredEndpointTypes>({
  name: 'filtered',
  transport: restEndpointTransport,
  inputParameters,
})
