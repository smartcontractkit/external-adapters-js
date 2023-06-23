import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AddressTransport } from '../transport/address'

const networks = ['moonbeam']
const chainIds = ['mainnet', 'testnet']

export const inputParameters = new InputParameters({
  contractAddress: {
    description: 'The address of the Address Manager contract holding the custodial addresses.',
    type: 'string',
  },
  chainId: {
    description: 'The name of the target custodial chain',
    options: chainIds,
    type: 'string',
    default: 'mainnet',
  },
  network: {
    description: 'The name of the target custodial network protocol',
    options: networks,
    type: 'string',
    default: 'moonbeam',
  },
})

export interface PorInputAddress {
  network: string
  chainId: string
  address: string
}

interface ResponseSchema {
  Data: {
    result: PorInputAddress[]
  }
  Result: null
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: ResponseSchema
  Settings: typeof config.settings
}

export const addressEndpoint = new AdapterEndpoint({
  name: 'address',
  transport: new AddressTransport(),
  inputParameters,
})
