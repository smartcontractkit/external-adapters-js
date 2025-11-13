import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { markets, transport } from '../transport/market-status'

const inputParameters = new InputParameters({
  ...marketStatusEndpointInputParametersDefinition,
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: [...markets, ...markets.map((market) => market.toUpperCase())],
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
  aliases: markets.map((market) => `${market}-market-status`),
  transport,
  inputParameters,
  requestTransforms: [
    (req) => {
      const data = req.requestContext.data
      data.market = data.market.toLowerCase()
      return req
    },
  ],
})
