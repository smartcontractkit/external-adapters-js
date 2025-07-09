import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
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
    status?: string
    end_time?: string
    start_time?: string
    symbol?: string
    result?: number
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
  overrides: overrides['gmci'],
})
