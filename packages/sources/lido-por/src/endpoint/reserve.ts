import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { balanceTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    lidoContract: {
      required: true,
      type: 'string',
      description: 'The address of the lido POR contract',
    },
  },
  [
    {
      lidoContract: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'reserve',
  aliases: [],
  transport: balanceTransport,
  inputParameters,
})
