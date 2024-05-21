import { config } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { chainIds, networks } from '../transport/utils'
import { transport } from '../transport/totalSupply'

export const inputParameters = new InputParameters(
  {
    staderConfigAddress: {
      description: 'The address of the Stader Config contract.',
      type: 'string',
    },
    network: {
      description: 'The name of the target custodial network protocol',
      options: networks,
      type: 'string',
      default: 'ethereum',
    },
    chainId: {
      description: 'The name of the target custodial chain',
      options: chainIds,
      type: 'string',
      default: 'mainnet',
    },
    confirmations: {
      type: 'number',
      description: 'The number of confirmations to query data from',
      default: 0,
    },
    syncWindow: {
      description:
        "The number of blocks Stader's reported block cannot be within of the current block. Used to ensure the balance and total supply feeds are reporting info from the same block.",
      default: 300,
      type: 'number',
    },
  },
  [
    {
      chainId: 'goerli',
      network: 'ethereum',
      confirmations: 0,
      syncWindow: 300,
    },
  ],
)

interface ResponseSchema {
  Data: {
    result: string
  }
  Result: string
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export const totalSupplyEndpoint = new AdapterEndpoint({
  name: 'totalSupply',
  transport,
  inputParameters,
})
