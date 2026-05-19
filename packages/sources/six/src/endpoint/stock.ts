import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { wsTransport } from '../transport/stock'

export const inputParameters = new InputParameters(
  {
    ...stockEndpointInputParametersDefinition,
    type: {
      type: 'string',
      description: 'The type of request to serve',
      options: ['stock', 'stock_quotes'],
    },
  },
  [
    {
      base: 'ABBN_4',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response:
    | SingleNumberResultResponse
    | {
        Result: null
        Data: {
          mid_price: number
          bid_price: number
          bid_volume: number
          ask_price: number
          ask_volume: number
        }
      }
}

export const endpoint = new AdapterEndpoint({
  name: 'stock',
  aliases: ['stock_quotes'],
  transport: wsTransport,
  inputParameters: inputParameters,
  requestTransforms: [
    (req) => {
      const [ticker, market] = req.requestContext.data.base.split('_')
      if (!ticker || !market) {
        /// Not using customInputValidation because we want to validate after overrides are applied
        throw new AdapterInputError({
          statusCode: 400,
          message: 'base must be in the format of ${TICKER}_${MARKET}',
        })
      }
      // Legacy feed does not have this param set, we backfill from endpoint name
      if (!req.requestContext.data.type) {
        req.requestContext.data.type = req.requestContext.requestEndpointName as
          | 'stock'
          | 'stock_quotes'
      }
    },
  ],
})
