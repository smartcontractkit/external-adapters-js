import BigNumber from 'bignumber.js'
import { TimestampedProviderErrorResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ethers } from 'ethers'

const GWEI_DIVISOR = 1000000000
export const WITHDRAWAL_DONE_STATUS = 'withdrawal_done'
export const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
export const DEPOSIT_EVENT_LOOKBACK_WINDOW = 10000 // blocks
export const ONE_ETH_WEI = BigNumber(ethers.utils.parseEther('1').toString())

export type NetworkChainMap = {
  [network: string]: {
    [chain: string]: {
      poolFactory: string
      penalty: string
      stakePoolsManager: string
      ethx: string
      staderConfig: string
      permissionedPool: string
    }
  }
}

export const networks = ['ethereum']
export const chainIds = ['mainnet', 'goerli']

export const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      poolFactory: '',
      penalty: '',
      stakePoolsManager: '',
      ethx: '',
      staderConfig: '',
      permissionedPool: '',
    },
    goerli: {
      poolFactory: '0x8A44f6276e44B5b3DC4e4942c7267F235D9b6634',
      penalty: '0xd5Cafd2279409F19f2B23b709702acb1CB79a8FA',
      stakePoolsManager: '0x59C6f12156d7939016aA4A3FC4B11B9507bB05bE',
      ethx: '0xe624471812F4fb739dD4eF40A8f9fAbD9474CEAa',
      staderConfig: '0x6edc838058652ab89e9aC2F4916800E5a8d60E09',
      permissionedPool: '0x50297e640b62281b6Dac0d5Aa91848Fb028357Ea',
    },
  },
}

export const inputParameters = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
  elRewardAddresses: {
    description: 'List of unique execution layer reward addresses',
    type: 'array',
    required: true,
  },
  socialPoolAddresses: {
    description: 'List of socializing pool addresses',
    type: 'array',
    required: true,
  },
  stateId: {
    type: 'string',
    description: 'The beacon chain state ID to query',
    default: 'finalized',
  },
  validatorStatus: {
    required: false,
    type: 'array',
    description: 'A filter to apply validators by their status',
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
    description: 'The adddress of the Permissioned Pool',
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
} satisfies InputParameters

export enum StaderValidatorStatus {
  INITIALIZED,
  INVALID_SIGNATURE,
  FRONT_RUN,
  PRE_DEPOSIT,
  DEPOSITED,
  IN_ACTIVATION_QUEUE,
  ACTIVE,
  IN_EXIT_QUEUE,
  EXITED,
  WITHDRAWN,
}

export interface RequestParams {
  addresses: ValidatorAddress[]
  elRewardAddresses: BasicAddress[]
  socialPoolAddresses: PoolAddress[]
  stateId: string
  validatorStatus?: string[]
  penaltyAddress?: string
  poolFactoryAddress?: string
  stakeManagerAddress?: string
  permissionedPoolAddress?: string
  network: string
  chainId: string
  confirmations: number
}

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
    status: StaderValidatorStatus
    withdrawVaultAddress: string
    operatorId: number
  }

export interface BalanceResponse {
  address: string
  balance: string
}

export interface ProviderResponse {
  execution_optimistic: false
  data: ValidatorState[]
}

export interface ValidatorState {
  index: string
  balance: string
  status: string
  validator: {
    pubkey: string
    withdrawal_credentials: string
    effective_balance: string
    slashed: boolean
    activation_eligibility_epoch: string
    activation_epoch: string
    exit_epoch: string
    withdrawable_epoch: string
  }
}

export interface ResponseSchema {
  Data: {
    result: BalanceResponse[]
  }
  Result: null
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: ResponseSchema
  Settings: typeof config.settings
}

export const chunkArray = (addresses: string[], size: number): string[][] =>
  addresses.length > size
    ? [addresses.slice(0, size), ...chunkArray(addresses.slice(size), size)]
    : [addresses]

// Value must be in wei
export function formatValueInGwei(value: BigNumber): string {
  return value.div(GWEI_DIVISOR).toString()
}

export const buildErrorResponse = (
  errorMessage: string,
  providerDataRequestedUnixMs: number,
): TimestampedProviderErrorResponse => {
  return {
    statusCode: 500,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
