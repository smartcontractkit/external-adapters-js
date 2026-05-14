import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'

import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/market-status'

export const inputParameters = new InputParameters(marketStatusEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: MarketStatusResultResponse
  Settings: typeof config.settings
}

export const endpoint = new MarketStatusEndpoint({
  name: 'market-status',
  aliases: [],
  transport: httpTransport,
  inputParameters,
  requestTransforms: [
    (req) => {
      const market = req.requestContext.data.market.toUpperCase()
      if (market in overrides) {
        req.requestContext.data.market = overrides[market as keyof typeof overrides]
      }
    },
  ],
})
