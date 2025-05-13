import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { marketAliases, transport } from '../transport/market-status'
import { validMarkets } from '../transport/utils'

const inputParameters = new InputParameters({
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: [...validMarkets, ...marketAliases],
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
  aliases: [],
  transport,
  inputParameters,
})
