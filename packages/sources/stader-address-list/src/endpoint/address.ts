import { PoRAddressEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/address'

const networks = ['ethereum']
const chainIds = ['mainnet', 'goerli']

export const inputParameters = new InputParameters(
  {
    poolFactoryAddress: {
      description: 'The address of the Stader PoolFactory contract.',
      type: 'string',
    },
    permissionlessNodeRegistry: {
      description: 'The address of the Stader Permissionless Node Registry contract.',
      type: 'string',
    },
    stakeManagerAddress: {
      description: 'The address of the Stader StakeManager contract.',
      type: 'string',
    },
    penaltyAddress: {
      description: 'The address of the Stader Penalty contract.',
      type: 'string',
    },
    permissionedPoolAddress: {
      description: 'The address of the Stader Permissioned Pool.',
      type: 'string',
    },
    staderConfigAddress: {
      description: 'The address of the Stader Config contract.',
      type: 'string',
    },
    staderOracleAddress: {
      description: 'The address of the Stader Oracle contract.',
      type: 'string',
    },
    confirmations: {
      type: 'number',
      description: 'The number of confirmations to query data from',
      default: 0,
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
      default: 'ethereum',
    },
    validatorStatus: {
      required: false,
      type: 'string',
      description: 'A filter to apply validators by their status',
      array: true,
    },
    batchSize: {
      description: 'The number of addresses to fetch from the contract at a time',
      default: 10,
      type: 'number',
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
      batchSize: 10,
      chainId: 'goerli',
      confirmations: 0,
      network: 'ethereum',
      syncWindow: 300,
      validatorStatus: [],
    },
  ],
)

export type BasicAddress = {
  address: string
}

export type PoolAddress = BasicAddress & {
  poolId: number
}

export type ValidatorAddress = BasicAddress &
  PoolAddress & {
    network: string
    chainId: string
    withdrawVaultAddress: string
    operatorId: number
    status: number
  }

export interface ResponseSchema {
  Data: {
    stakeManagerAddress?: string
    poolFactoryAddress?: string
    penaltyAddress?: string
    permissionedPoolAddress?: string
    staderConfigAddress?: string
    validatorStatus?: string[]
    socialPoolAddresses: PoolAddress[]
    elRewardAddresses: BasicAddress[]
    confirmations: number
    network: string
    chainId: string
    reportedBlock: number
    result: ValidatorAddress[]
  }
  Result: null
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export const addressEndpoint = new PoRAddressEndpoint({
  name: 'address',
  transport,
  inputParameters,
})
