import { NumericResultEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { buildDxFeedHttpTransport } from '../transport/price-http'
import { transport as wsTransport } from '../transport/price-ws'
import { inputParameters, validateWsEnvVars } from './utils'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new NumericResultEndpoint({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters,
  overrides: overrides.dxfeed,
  customInputValidation: (req, settings) => {
    if (req.requestContext.transportName === 'ws') {
      return validateWsEnvVars(settings)
    }
    return
  },
})
