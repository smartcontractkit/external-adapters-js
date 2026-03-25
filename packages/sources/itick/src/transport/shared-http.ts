import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, ResponseGenerics } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { inputParameters } from '../endpoint/shared'

type HttpTransportTypes<ResponseSchema, Response extends ResponseGenerics> = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: Response
  Provider: { RequestBody: never; ResponseBody: ResponseSchema }
}

export const createHttpTransport = <ResponseSchema, Response extends ResponseGenerics>({
  region,
  apiKey,
  apiPath,
  type,
  messageHandler,
}: {
  region: string
  apiKey: string | undefined
  apiPath: string
  type: string
  messageHandler: (message: ResponseSchema) => ProviderResult<{
    Parameters: typeof inputParameters.definition
    Response: Response
  }>[]
}) => {
  return new HttpTransport<HttpTransportTypes<ResponseSchema, Response>>({
    prepareRequests: (params, config) => {
      return params.map((param) => {
        const { base: symbol } = param
        return {
          method: 'GET',
          params: [param],
          request: {
            baseURL: config.API_ENDPOINT,
            url: `/${apiPath}/${type}`,
            headers: {
              token: apiKey,
            },
            params: {
              region,
              code: symbol,
            },
          },
        }
      })
    },
    parseResponse: (params, response) => {
      if (!response.data) {
        return params.map((param) => {
          const { base: symbol } = param
          return {
            params: param,
            response: {
              errorMessage: `The data provider didn't return any value for symbol '${symbol}' and region '${region}'.`,
              statusCode: 502,
            },
          }
        })
      }

      return messageHandler(response.data)
    },
  })
}
