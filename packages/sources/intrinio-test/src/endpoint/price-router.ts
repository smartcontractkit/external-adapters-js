import { httpTransport } from './price'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wsTransport } from './price-ws'
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

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'price',
  aliases: ['stock'],
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  inputParameters: inputParameters,
})
