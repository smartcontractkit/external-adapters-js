import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from './forex'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { BaseAdapterSettings } from '@chainlink/external-adapter-framework/config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
} satisfies InputParameters

export interface ProviderResponseBody {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string
    '2. From_Currency Name': string
    '3. To_Currency Code': string
    '4. To_Currency Name': string
    '5. Exchange Rate': string
    '6. Last Refreshed': string
    '7. Time Zone': string
    '8. Bid Price': string
    '9. Ask Price': string
  }
  'Error Message': string
}

export interface RequestParams {
  base: string
  quote: string
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
  name: 'forex',
  aliases: ['price'],
  transport: httpTransport,
  inputParameters: inputParameters,
})
