import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from './forex'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description:
      'The symbol of the currency to query. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description:
      'The symbol of the currency to convert to. The full list of options can be found here [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/)',
    required: true,
  },
} as const

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
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    HTTP: httpTransport,
  },
  () => 'HTTP',
)

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'forex',
  transport: routingTransport,
  inputParameters: inputParameters,
})
