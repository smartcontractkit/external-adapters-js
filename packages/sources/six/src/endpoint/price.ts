import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { wsTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    ...stockEndpointInputParametersDefinition,
    rawEndpoint: {
      type: 'string',
      description: 'The value of endpoint input',
    },
  },
  [
    {
      base: 'ABBN_4',
      rawEndpoint: '',
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
      req.requestContext.data.rawEndpoint = req.requestContext.requestEndpointName
    },
  ],
})
