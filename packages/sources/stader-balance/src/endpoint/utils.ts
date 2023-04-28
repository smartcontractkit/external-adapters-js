import {
  makeLogger,
  TimestampedProviderErrorResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import axios, { AxiosRequestConfig } from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { config } from '../config'

const logger = makeLogger('Balance Utils')

const GWEI_DIVISOR = 1000000000
export const WITHDRAWAL_DONE_STATUS = 'withdrawal_done'
export const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
export const DEPOSIT_EVENT_LOOKBACK_WINDOW = 10000 // blocks
export const ONE_ETH_WEI = BigNumber(ethers.utils.parseEther('1').toString())
export const THIRTY_ONE_ETH_WEI = BigNumber(ethers.utils.parseEther('31').toString())

export type NetworkChainMap = {
  [network: string]: {
    [chain: string]: {
      poolFactory: string
      penalty: string
      stakePoolsManager: string
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
      staderConfig: '',
      permissionedPool: '',
    },
    goerli: {
      poolFactory: '0x019a7ced1927946eADb28735f15a20e3ed762240',
      penalty: '0x3A8F47BcE46bB852FB51021ee87f9fA2329cC70E',
      stakePoolsManager: '0x974Db4Fb26993289CAD9f79Bde4eAE097503064f',
      staderConfig: '0xe34c84A15326f7980F59DE6b5A77C57ca2043c48',
      permissionedPool: '0xEc4166439523e8C2FaE395201f04876Cc7C02d68',
    },
  },
}

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

export const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    required: true,
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
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
      network: {
        type: 'string',
        description: 'TODO',
        required: true,
      },
      chainId: {
        type: 'string',
        description: 'TODO',
        required: true,
      },
      status: {
        type: 'number',
        description: 'TODO',
        required: true,
        options: Object.values(StaderValidatorStatus),
      },
      withdrawVaultAddress: {
        type: 'string',
        description: 'TODO',
        required: true,
      },
      operatorId: {
        type: 'number',
        description: 'TODO',
        required: true,
      },
    },
  },
  elRewardAddresses: {
    description: 'List of unique execution layer reward addresses',
    type: 'string',
    required: true,
    array: true,
  },
  socialPoolAddresses: {
    description: 'List of socializing pool addresses',
    type: 'string',
    required: true,
    array: true,
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
  staderConfigAddress?: string
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
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: ResponseSchema
}

export const chunkArray = <T>(addresses: T[], size: number): T[][] =>
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

// Parse little endian value from deposit event and convert to wei
export const parseLittleEndian = (value: string): BigNumber => {
  const result = []
  let start = value.length - 2
  while (start >= 2) {
    result.push(value.substring(start, start + 2))
    start -= 2
  }
  const convertDecimal = BigNumber(`0x${result.join('')}`)
  return BigNumber(ethers.utils.parseUnits(convertDecimal.toString(), 'gwei').toString())
}

// Separate the address set into the specified batch size
// Add the batches as comma-separated lists to a new list used to make the requests
export const batchValidatorAddresses = (
  addresses: ValidatorAddress[],
  batchSize: number,
): string[] => {
  const batchedAddresses: string[] = []
  for (let i = 0; i < addresses.length / batchSize; i++) {
    batchedAddresses.push(
      addresses
        .slice(i * batchSize, i * batchSize + batchSize)
        .map(({ address }) => address)
        .join(','),
    )
  }
  return batchedAddresses
}

export const withErrorHandling = async <T>(stepName: string, fn: () => T) => {
  try {
    const result = await fn()
    logger.debug(`${stepName} | got result: ${result}`)
    return result
  } catch (e) {
    logger.error({ error: e })
    throw new Error(`Failed step: ${stepName}`)
  }
}

export const fetchAddressBalance = async (
  address: string,
  blockTag: number,
  provider: ethers.providers.JsonRpcProvider,
): Promise<BigNumber> => BigNumber((await provider.getBalance(address, blockTag)).toString())

// Get the address for the ETH deposit contract
export const fetchEthDepositContractAddress = async (
  settings: typeof config.settings,
): Promise<string> => {
  const url = `/eth/v1/config/deposit_contract`
  const options: AxiosRequestConfig = {
    baseURL: settings.BEACON_RPC_URL,
    url,
  }

  return withErrorHandling(`Fetch ETH deposit contract address`, async () => {
    const response = await axios.request<{ data: { chainId: string; address: string } }>(options)
    return response.data.data.address
  })
}
