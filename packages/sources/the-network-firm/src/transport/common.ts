import { PoRProviderResponse } from '@chainlink/external-adapter-framework/adapter/por'
import { ProviderRequestConfig } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'

export const inputParameters = new InputParameters({})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export interface ResponseSchema {
  totalReserve: string
  totalToken: string
  ripcord: boolean
  ripcordDetails: string[]
  timestamp: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export function prepareRequests(
  params: TypeFromDefinition<BaseEndpointTypes['Parameters']>[],
  baseURL: string,
  url: string,
  apikey: string,
): ProviderRequestConfig<HttpTransportTypes> {
  return {
    params,
    request: {
      baseURL,
      url,
      headers: {
        apikey,
      },
    },
  }
}
