import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters(
  {
    symbol: {
      required: true,
      type: 'string',
      description: 'Index name',
    },
  },
  [
    {
      symbol: 'GMCI30',
    },
  ],
)

export type GMCIResultResponse = {
  Result: number
  Data: {
    symbol: string
    result: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: GMCIResultResponse
  Settings: typeof config.settings
}
