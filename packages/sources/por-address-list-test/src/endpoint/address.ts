import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressTransport } from '../transport/address'

export const inputParameters = new InputParameters({
  confirmations: {
    description: 'The number of confirmations to query data from',
    type: 'number',
    default: 0,
  },
  contractAddress: {
    description: 'The contract address holding the custodial addresses',
    type: 'string',
    required: true,
  },
  batchSize: {
    description: 'The number of addresses to fetch from the contract at a time',
    type: 'number',
    default: 10,
  },
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
  searchLimboValidators: {
    type: 'boolean',
    description: 'Flag to pass on to the balance adapter to search for limbo validators',
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

export const endpoint = new AdapterEndpoint({
  name: 'address',
  transport: addressTransport,
  inputParameters,
})
