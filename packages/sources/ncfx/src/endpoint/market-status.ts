import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { markets, transport } from '../transport/market-status'

const inputParameters = new InputParameters({
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: markets,
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: MarketStatusResultResponse
  Settings: typeof config.settings
}

export const marketStatusEndpoint = new MarketStatusEndpoint({
  name: 'market-status',
  aliases: ['forex-market-status', 'metals-market-status'],
  transport,
  inputParameters,
})
