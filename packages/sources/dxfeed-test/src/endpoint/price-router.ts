import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { batchTransport } from './price'
import { wsTransport } from './price-ws'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin', 'market'],
    type: 'string',
    description: 'The symbol of the currency to query',
    required: true,
  },
} satisfies InputParameters

export interface RequestParams {
  base: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

function customInputValidation(
  req: AdapterRequest<EndpointTypes['Request']>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !settings.WS_API_ENDPOINT) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is not set',
    })
  }
  return
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<EndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', batchTransport),
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation,
})
