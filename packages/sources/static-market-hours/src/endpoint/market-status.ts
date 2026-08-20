import {
  MarketStatusEndpoint,
  marketStatusEndpointInputParametersDefinition,
  MarketStatusResultResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { customTransport } from '../transport/market-status'

export const inputParameters = new InputParameters(marketStatusEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: MarketStatusResultResponse
  Settings: typeof config.settings
}

export const endpoint = new MarketStatusEndpoint({
  name: 'market-status',
  transport: customTransport,
  inputParameters,
  customInputValidation: (request, settings): undefined => {
    const params = request.requestContext.data

    switch (params.type) {
      case 'regular':
        settings.MARKET_REGULAR_SCHEDULE.get(params.market)
        return
      case '24/5':
        settings.MARKET_24_5_SCHEDULE.get(params.market)
        return
    }
    throw new AdapterInputError({
      statusCode: 400,
      message: `Invalid market type: ${params.type}. Must be one of 'regular' or '24/5'`,
    })
  },
})
