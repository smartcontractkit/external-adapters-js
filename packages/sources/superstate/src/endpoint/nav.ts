import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { NavTransport } from '../transport/nav'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters({
  fundId: {
    description: 'Fund id',
    type: 'number',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserves',
  aliases: ['por', 'nav'],
  inputParameters,
  transport: new NavTransport(),
})
