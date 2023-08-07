import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/balance'
import { StaderValidatorStatus, ResponseSchema, networks, chainIds } from '../transport/utils'
export const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    required: true,
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
    array: true,
    type: {
      address: {
        type: 'string',
        required: true,
        description: 'One of the addresses to get balance of',
      },
      poolId: {
        type: 'number',
        required: true,
        description: 'The ID of the validator pool',
      },
      status: {
        type: 'number',
        description: 'Stader status ID for this particular validator',
        required: true,
        options: Object.values(StaderValidatorStatus).filter(
          (value) => typeof value === 'number',
        ) as number[],
      },
      withdrawVaultAddress: {
        type: 'string',
        description: 'Validator withdrawal address for this particular validator',
        required: true,
      },
      operatorId: {
        type: 'number',
        description: 'The Stader assigned operator ID for this particular validator',
        required: true,
      },
    },
  },
  elRewardAddresses: {
    description: 'List of unique execution layer reward addresses',
    type: {
      address: {
        type: 'string',
        required: true,
        description: 'One of the execution layer reward addresses',
      },
    },
    required: true,
    array: true,
  },
  socialPoolAddresses: {
    description: 'List of socializing pool addresses',
    type: {
      address: {
        type: 'string',
        required: true,
        description: 'One of the social pool addresses',
      },
      poolId: {
        type: 'number',
        required: true,
        description: 'The ID of the social pool',
      },
    },
    required: true,
    array: true,
  },
  reportedBlock: {
    type: 'number',
    description: 'The reported block number retrieved from Stader',
    required: true,
  },
  stateId: {
    type: 'string',
    description: 'The beacon chain state ID to query',
    default: 'finalized',
  },
  validatorStatus: {
    required: false,
    type: 'string',
    description: 'A filter to apply validators by their status',
    array: true,
  },
  penaltyAddress: {
    description: 'The address of the Stader Penalty contract.',
    type: 'string',
  },
  poolFactoryAddress: {
    description: 'The address of the Stader PoolFactory contract.',
    type: 'string',
  },
  stakeManagerAddress: {
    description: 'The adddress of the Stader StakeManager contract',
    type: 'string',
  },
  permissionedPoolAddress: {
    description: 'The adddress of the Stader Permissioned Pool',
    type: 'string',
  },
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
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export const balanceEndpoint = new AdapterEndpoint({
  name: 'balance',
  transport,
  inputParameters,
})
