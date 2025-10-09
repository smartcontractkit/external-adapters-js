import {
  AdapterEndpoint,
  LwbaResponseDataFields,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { dataEngineWs } from '../transport/crypto-lwba-ws'

export const inputParameters = new InputParameters(
  {
    feedId: {
      required: true,
      type: 'string',
      description: 'The feedId for the token pair to query',
    },
  },
  [
    {
      feedId: '0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: LwbaResponseDataFields
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  aliases: [],
  transport: dataEngineWs,
  inputParameters,
})
