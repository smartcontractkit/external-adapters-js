import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { transport } from '../transport/market-status'

export const inputParameters = new InputParameters(marketStatusEndpointInputParametersDefinition)

export type CompositeMarketStatusResultResponse = MarketStatusResultResponse & {
  Data: {
    source?: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: CompositeMarketStatusResultResponse
  Settings: typeof config.settings
}

export const marketStatusEndpoint = new MarketStatusEndpoint({
  name: 'market-status',
  transport,
  inputParameters,
})
