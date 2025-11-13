import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { marketAliases, transport } from '../transport/market-status'
import { validMarkets } from '../transport/utils'

const getAllMarketOptions = (): string[] => {
  const allMarkets = [...validMarkets, ...marketAliases]
  return [...allMarkets, ...allMarkets.map((market) => market.toLowerCase())]
}

const inputParameters = new InputParameters({
  ...marketStatusEndpointInputParametersDefinition,
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: getAllMarketOptions(),
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
  transport,
  inputParameters,
  requestTransforms: [
    (req) => {
      const data = req.requestContext.data
      data.market = data.market.toUpperCase()
      return req
    },
  ],
})
