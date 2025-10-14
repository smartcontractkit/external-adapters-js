import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { virtuneTokenTransport } from '../transport/virtune-token'
import { sharedVirtuneInputParameters } from './virtune'

export const inputParameters = new InputParameters(
  {
    ...sharedVirtuneInputParameters,
    contractAddress: {
      description: 'The contract address of the token, to pass be included in the response',
      type: 'string',
      default: '',
    },
  },
  [
    {
      accountId: 'VIRBTC',
      network: 'ethereum',
      chainId: '1',
      contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRTokenAddress[]
    }
  }
  Settings: typeof config.settings
}

// This endpoint is similar to the virtune endpoint but returns a response in a
// format that proof-of-reserves can pass on to token-balance.
export const endpoint = new AdapterEndpoint({
  name: 'virtune-token',
  transport: virtuneTokenTransport,
  inputParameters,
})
