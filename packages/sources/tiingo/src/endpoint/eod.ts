import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/eod'

const inputParameters = new InputParameters({
  ticker: {
    aliases: ['base', 'from', 'coin'],
    required: true,
    type: 'string',
    description: 'The stock ticker to query',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'eod',
  transport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
