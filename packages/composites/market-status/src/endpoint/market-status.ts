import { MarketStatusEndpoint, MarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { transport } from '../transport/market-status'

export const inputParameters = new InputParameters({
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    required: true,
  },
})

export type MarketStatusResultResponse = {
  Result: MarketStatus
  Data: {
    result: MarketStatus
    source?: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: MarketStatusResultResponse
  Settings: typeof config.settings
}

export const marketStatusEndpoint = new MarketStatusEndpoint({
  name: 'market-status',
  transport,
  inputParameters,
})
