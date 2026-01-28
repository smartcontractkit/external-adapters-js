import {
  AdapterEndpoint,
  marketStatusEndpointInputParametersDefinition,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { transport } from '../transport/market-session'
import { markets } from '../transport/utils'

const inputParameters = new InputParameters({
  market: {
    aliases: [],
    type: 'string',
    description: 'The name of the market',
    options: [...markets, ...markets.map((market) => market.toUpperCase())],
    required: true,
  },
  type: marketStatusEndpointInputParametersDefinition.type,
  timezone: {
    type: 'string',
    description: 'America/New_York means Eastern Time Zone',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: {
        status: MarketStatusResultResponse['Result']
        statusString: string
        time: string
      }[]
    }
  }
  Settings: typeof config.settings
}

export const marketSessionEndpoint = new AdapterEndpoint({
  name: 'market-session',
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
