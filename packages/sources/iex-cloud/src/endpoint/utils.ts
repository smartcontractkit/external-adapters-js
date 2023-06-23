import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export const stockInputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol to query',
    required: true,
    type: 'string',
  },
})

export type StockBaseEndpointTypes = {
  Parameters: typeof stockInputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
