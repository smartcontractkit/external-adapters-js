import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { PriceEndpointTypes } from '../price-utils'
import { httpTransport, inputParameters } from './forex'
import { wsTransport } from './forex-ws'

function customInputValidation(
  req: AdapterRequest<PriceEndpointTypes['Request']>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !settings.WS_API_KEY) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_KEY is not set',
    })
  }
  return
}

export const endpoint = new PriceEndpoint({
  name: 'forex',
  aliases: ['batch'],
  transportRoutes: new TransportRoutes<PriceEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: inputParameters,
  customInputValidation,
  overrides: overrides.tradermade,
})
