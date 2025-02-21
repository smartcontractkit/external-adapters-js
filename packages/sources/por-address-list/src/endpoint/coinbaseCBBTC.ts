import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { coinbaseHttpTransport } from '../transport/coinbaseBTC'

export const inputParameters = new InputParameters(
  {
    network: {
      description: 'The network name to associate with the addresses',
      type: 'string',
      required: true,
    },
    chainId: {
      description: 'The chain ID to associate with the addresses',
      type: 'string',
      required: true,
    },
  },
  [
    {
      network: 'bitcoin',
      chainId: '1',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'coinbaseBtcAddress',
  transport: coinbaseHttpTransport,
  inputParameters,
})
