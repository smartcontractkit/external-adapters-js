import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/stock_quotes'
import { customInputValidation, inputParameters } from './common'

export const stockQuotesInputParameters = new InputParameters(
  {
    ...inputParameters.definition,
    isOvernight: {
      default: false,
      description: 'If true, report overnight session data',
      type: 'boolean',
    },
  },
  [
    {
      base: 'US:AAPL',
      assetType: 'stocks',
      isOvernight: true,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof stockQuotesInputParameters.definition
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
      // For cme_futures
      expiry_date?: number
      roll_date?: number
      contract_month?: number
      price_goldman_roll?: number
      trading_day_of_month?: number
      price_goldman_continuous_roll?: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  aliases: ['quotes', 'forex', 'commodities', 'cme_futures'],
  transport: wsTransport,
  inputParameters: stockQuotesInputParameters,
  customInputValidation,
  requestTransforms: [
    (request) => {
      // endpoint forex + assetType commodities => commodities
      // otherwise forex
      if (
        request.requestContext.requestEndpointName === 'forex' &&
        request.requestContext.data.assetType !== 'commodities'
      ) {
        request.requestContext.data.assetType = 'forex'
      }
      if (request.requestContext.requestEndpointName === 'commodities') {
        request.requestContext.data.assetType = 'commodities'
      }
      if (request.requestContext.requestEndpointName === 'cme_futures') {
        request.requestContext.data.assetType = 'futures'
      }
      // assetType is not used when isOvernight is true
      // Force a value here so that any assetType resolve to the same cache
      if (request.requestContext.data.isOvernight) {
        request.requestContext.data.assetType = 'overnight'
      }
    },
  ],
})
