import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/batch-index'

export const inputParameters = new InputParameters(
  {
    indices: {
      description: 'Indices array to query API for',
      type: 'string',
      array: true,
      required: true,
    },
  },
  [
    {
      indices: ['12345A67890', '234567B8901'],
    },
  ],
)

export type IndexValues = {
  level: number
  pct1mo: number
  pct12mo: number
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      [key: string]: IndexValues
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'batch-index',
  transport,
  inputParameters,
})
