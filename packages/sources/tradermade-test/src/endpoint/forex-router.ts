import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchEndpointTypes } from '../price-utils'
import { httpTransport, inputParameters } from './forex'
import { wsTransport } from './forex-ws'

export const routingTransport = new RoutingTransport<BatchEndpointTypes>(
  {
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'forex',
  aliases: ['batch'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
