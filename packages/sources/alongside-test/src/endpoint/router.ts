import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { ProviderResponseBody, httpTransport, inputParameters, RequestParams } from './balances'

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
  name: 'balances',
  transport: routingTransport,
  inputParameters: inputParameters,
})
