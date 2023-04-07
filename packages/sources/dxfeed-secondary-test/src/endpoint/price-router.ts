import {
  buildDxFeedHttpTransport,
  buildDxFeedWsTransport,
  customInputValidation,
  EndpointTypes,
  inputParameters,
} from '@chainlink/dxfeed-test-adapter'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('ws', buildDxFeedWsTransport())
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters,
  customInputValidation,
})
