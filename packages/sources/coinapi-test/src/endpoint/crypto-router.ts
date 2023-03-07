import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { EndpointTypes, inputParameters } from '../crypto-utils'
import { httpTransport } from './crypto'
import { wsTransport } from './crypto-ws'

export const endpoint = new PriceEndpoint({
  name: 'crypto',
  aliases: ['price'],
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  inputParameters: inputParameters,
})
