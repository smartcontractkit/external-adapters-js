import {
  makeLogger,
  TimestampedProviderErrorResponse,
} from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import axios, { AxiosRequestConfig } from 'axios'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { config } from '../../config'
import { PoRBalance } from '@chainlink/external-adapter-framework/adapter/por'

const logger = makeLogger('Balance Utils')

const GWEI_DIVISOR = 1_000_000_000
const SECONDS_PER_SLOT = 12
const SLOTS_PER_EPOCH = 32

export const WITHDRAWAL_DONE_STATUS = 'withdrawal_done'
export const PENDING_INITIALIZED = 'pending_initialized'
export const DEPOSIT_EVENT_TOPIC =
  '0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5'
export const DEPOSIT_EVENT_LOOKBACK_WINDOW = 10_000 // blocks
export const ONE_ETH_WEI = BigNumber(ethers.utils.parseEther('1').toString())
export const THIRTY_ONE_ETH_WEI = BigNumber(ethers.utils.parseEther('31').toString())
export const THIRTY_TWO_ETH_WEI = BigNumber(ethers.utils.parseEther('32').toString())

export type NetworkChainMap = {
  [network: string]: {
    [chain: string]: {
      staderConfig: string
    }
  }
}

export const networks = ['ethereum']
export const chainIds = ['mainnet', 'goerli']

export const staderNetworkChainMap: NetworkChainMap = {
  ethereum: {
    mainnet: {
      staderConfig: '',
    },
    goerli: {
      staderConfig: '0x198C5bC65acce5a35Ae7A8B7AEf4f92FA94C1c6E',
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

export type RequestParams = typeof inputParameters.validated

export type BasicAddress = {
  address: string
}

export type PoolAddress = BasicAddress & {
  poolId: number
}

export type ValidatorAddress = BasicAddress &
  PoolAddress & {
    status: StaderValidatorStatus
    withdrawVaultAddress: string
    operatorId: number
  }

export interface BalanceResponse extends PoRBalance {
  address: string
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

interface GenesisResponse {
  data: {
    genesis_time: string
    genesis_validators_root: string
    genesis_fork_version: string
  }
}

interface FinalityCheckpointResponse {
  execution_optimistic: boolean
  data: {
    previous_justified: {
      epoch: string
      root: string
    }
    current_justified: {
      epoch: string
      root: string
    }
    finalized: {
      epoch: string
      root: string
    }
  }
}

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
  // If batch size is 0, send all validators in a single request. Allows skipping batching
  if (batchSize === 0) {
    return [addresses.map(({ address }) => address).join(',')]
  }
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

export const parseBigNumber = (value: ethers.BigNumber): BigNumber => {
  return BigNumber(value.toString())
}

export const getSlotNumber = async (params: {
  provider: ethers.providers.JsonRpcProvider
  blockTag: number
  genesisTimestampInSec: number
  settings: typeof config.settings
}): Promise<number> => {
  return withErrorHandling(
    `Calculating Beacon slot number using execution layer block number ${params.blockTag}`,
    async () => {
      const blockTimestampInSec = (await params.provider.getBlock(params.blockTag)).timestamp
      const timeSinceGenesisInSec = blockTimestampInSec - params.genesisTimestampInSec
      const slot = Math.floor(timeSinceGenesisInSec / SECONDS_PER_SLOT)
      const finalizedSlot = await getFinalizedSlotNumber(params.settings.BEACON_RPC_URL)
      if (slot > finalizedSlot) {
        throw new Error('Calculated slot is not finalized')
      }
      return slot
    },
  )
}

const getFinalizedSlotNumber = async (beaconRpcUrl: string): Promise<number> => {
  return withErrorHandling(`Fetching latest finalized slot`, async () => {
    const url = `/eth/v1/beacon/states/finalized/finality_checkpoints`
    const response = await axios.request<FinalityCheckpointResponse>({
      baseURL: beaconRpcUrl,
      url,
    })
    const epoch = Number(response.data.data.finalized.epoch)
    return epoch * SLOTS_PER_EPOCH
  })
}

export const getBeaconGenesisTimestamp = async (beaconRpcUrl: string): Promise<number> => {
  return withErrorHandling(`Fetching Beacon genesis info`, async () => {
    const url = `/eth/v1/beacon/genesis`
    const response = await axios.request<GenesisResponse>({
      baseURL: beaconRpcUrl,
      url,
    })
    return Number(response.data.data.genesis_time)
  })
}
