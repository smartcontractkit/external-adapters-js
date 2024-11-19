import { PoRAddress, PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { bedrockHttpTransport } from '../transport/bedrockUniBTC'

export const inputParameters = new InputParameters(
  {
    type: {
      description:
        'The type of addresses you are looking for. BTC is native BTC address. tokens is for token-balance EA. vault is for eth-balance EA.',
      options: ['BTC', 'tokens', 'vault'],
      type: 'string',
      required: true,
    },
  },
  [
    {
      type: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRAddress[] | PoRTokenAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'bedrockBtcAddress',
  transport: bedrockHttpTransport,
  inputParameters,
})
