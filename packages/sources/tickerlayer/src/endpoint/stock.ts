import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { wsTransport } from '../transport/stock'
import { customInputValidation, inputParameters } from './common'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'stock',
  aliases: ['price'],
  transport: wsTransport,
  inputParameters,
  customInputValidation,
})
