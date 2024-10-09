import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { balanceTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    withdrawalCredential: {
      required: true,
      type: 'string',
      description: "Validator's withdrawal credential",
    },
    bufferContract: {
      required: true,
      type: 'string',
      description: 'The address of contract that contains getBufferedEther',
    },
  },
  [
    {
      withdrawalCredential: '0x010000000000000000000000b9d7934878b5fb9610b3fe8a5e441e8fad7e293f',
      bufferContract: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
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
