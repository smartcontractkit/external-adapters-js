import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from './quote'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { BaseAdapterSettings } from '@chainlink/external-adapter-framework/config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
} as const

export interface ProviderResponseBody {
  c: number
  d: number
  dp: number
  h: number
  l: number
  o: number
  pc: number
  t: number
}

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof customSettings & BaseAdapterSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'quote',
  aliases: ['common'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
