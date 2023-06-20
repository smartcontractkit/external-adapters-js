import { httpTransport } from '../transport/price-http'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from '../transport/price-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'asset'],
    description: 'The symbol of the asset to query',
    type: 'string',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['stock'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  inputParameters: inputParameters,
})
