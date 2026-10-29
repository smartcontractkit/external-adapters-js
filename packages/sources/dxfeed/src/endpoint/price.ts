import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import type { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import type { config } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters, validateWsEnvVars } from './utils'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

// The dxfeed price endpoint takes only `base`; PriceEndpoint also requires a
// `quote` parameter, so AdapterEndpoint is the correct base class here.
export const endpoint = new AdapterEndpoint<BaseEndpointTypes>({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation: (req, settings): AdapterError | undefined => {
    if (req.requestContext.transportName === 'ws') {
      return validateWsEnvVars(settings)
    }
    return
  },
})
