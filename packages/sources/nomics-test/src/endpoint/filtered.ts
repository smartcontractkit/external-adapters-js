import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings } from '../config'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

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
interface ResponseSchema {
  currency: string
  price: number
}

interface RequestParams {
  base: string
  exchange: string
}

interface ProviderRequestBody {
  currency: string
  key: string
  exchanges: string
}

export type FilteredEndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ResponseSchema
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
      params,
    }
  },
  parseResponse: (_, res) => {
    if (!res.data || !Object.keys(res.data).length) {
      throw new AdapterError({
        message:
          'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides.',
      })
    }
    return {
      data: {
        result: res.data.price,
      },
      statusCode: 200,
      result: res.data.price,
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
