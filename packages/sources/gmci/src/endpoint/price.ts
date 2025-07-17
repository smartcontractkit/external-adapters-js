import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      description: 'Index name',
    },
  },
  [
    {
      index: 'GMCI30',
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

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: transport,
  inputParameters,
})
