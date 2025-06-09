import {
  MarketStatusEndpoint,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

import { config } from '../config'
import { marketAliases, transport } from '../transport/market-status'
import { validMarkets } from '../transport/utils'

const getAllMarketOptions = (): string[] => {
  const allMarkets = [...validMarkets, ...marketAliases]
  return [...allMarkets, ...allMarkets.map((market) => market.toLowerCase())]
}

const inputParameters = new InputParameters({
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
    (req: AdapterRequest<TypeFromDefinition<typeof inputParameters.definition>>) => {
      const data = req.requestContext.data
      data.market = data.market.toUpperCase()
      return req
    },
  ],
})
