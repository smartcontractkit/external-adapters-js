import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { customSettings } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

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
  exchanges: string
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
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ResponseSchema
  }
}

const httpTransport = new HttpTransport<FilteredEndpointTypes>({
  prepareRequests: (params, config) => {
    const baseURL = config.API_ENDPOINT
    return params.map((param) => {
      const requestParams = {
        currency: param.base,
        key: config.API_KEY,
        exchanges: param.exchanges,
      }

      return {
        params: [{ base: param.base, exchanges: param.exchanges }],
        request: {
          baseURL,
          url: '/prices/restricted',
          params: requestParams,
        },
      }
    })
  },
  parseResponse: (params, res) => {
    if (!res.data || !Object.keys(res.data).length) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            statusCode: 400,
            errorMessage:
              'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
          },
        }
      })
    }
    return [
      {
        params: { exchanges: params[0].exchanges, base: params[0].base },
        response: {
          data: {
            result: res.data.price,
          },
          result: res.data.price,
        },
      },
    ]
  },
})

export const endpoint = new AdapterEndpoint<FilteredEndpointTypes>({
  name: 'filtered',
  transport: httpTransport,
  inputParameters,
})
