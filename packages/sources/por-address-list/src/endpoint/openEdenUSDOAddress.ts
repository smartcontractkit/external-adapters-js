import { PoRAddress, PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressTransport } from '../transport/openEdenUSDOAddress'

export const inputParameters = new InputParameters(
  {
    contractAddress: {
      description: 'The contract address holding the custodial addresses',
      type: 'string',
      required: true,
    },
    contractAddressNetwork: {
      description:
        'The network of the contract, used to match {NETWORK}_RPC_URL and {NETWORK}_RPC_CHAIN_ID in env var',
      type: 'string',
      required: true,
    },
    type: {
      description:
        'The type of addresses you are looking for. evm is for evm endpoint in token-balance EA. tbill is for tbill endpoint in token-balance EA.',
      options: ['evm', 'tbill'],
      type: 'string',
      default: 'evm',
    },
  },
  [
    {
      contractAddress: '0x440139321A15d14ce0729E004e91D66BaF1A08B0',
      contractAddressNetwork: 'BASE',
      type: 'tbill',
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
  name: 'openedenAddress',
  transport: addressTransport,
  inputParameters,
})
