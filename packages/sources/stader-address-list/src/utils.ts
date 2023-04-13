import {
  makeLogger,
  TimestampedProviderErrorResponse,
} from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import { StaderNodeRegistryContract_ABI } from './abi/StaderContractAbis'
import { config } from './config'

const logger = makeLogger('StaderAddressListUtil')

export type NetworkChainMap = {
  [network: string]: {
    [chain: string]: { poolFactory: string; permissionlessNodeRegistry: string }
  }
}

export type validatorsRegistryResponse = [
  status: number,
  pubkey: string,
  preDepositSignature: string,
  depositSignature: string,
  withdrawVaultAddress: string,
  operatorId: number,
  initialBondEth: number,
  depositTime: number,
  withdrawnTime: number,
]

export interface FunctionParameters {
  manager: ethers.Contract
  provider: ethers.providers.JsonRpcProvider
  poolCount: number
  blockTag: number
  network: string
  chainId: string
  batchSize: number
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
    withdrawVaultAddress: string
    operatorId: number
    status: number
  }

export interface RequestParams {
  poolFactoryAddress?: string
  permissionlessNodeRegistry?: string
  stakeManagerAddress?: string
  penaltyAddress?: string
  permissionedPoolAddress?: string
  staderConfigAddress?: string
  network: string
  chainId: string
  confirmations: number
  validatorStatus?: string[]
  batchSize: number
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
    result: ValidatorAddress[]
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

export const filterDuplicates = <T extends BasicAddress>(addresses: T[]): T[] => {
  const addressMap: Record<string, T> = {}
  for (const addressObject of addresses) {
    if (addressMap[addressObject.address]) {
      logger.warn(
        { warning: 'Duplicate address detected' },
        `The address "${addressObject.address}" is duplicated in the request and the duplicate has been removed.`,
      )
    } else {
      addressMap[addressObject.address] = addressObject
    }
  }
  return Object.values(addressMap)
}

export const calculatePages = (count: number, batchSize: number): number => {
  return count % batchSize === 0 ? count / batchSize : count / batchSize + 1
}

export const parsePools = async <T>(
  input: FunctionParameters,
  fn: (params: FunctionParameters & { poolId: number }) => Promise<T[]>,
): Promise<T[]> => {
  let results: T[] = []
  for (let i = 1; i <= input.poolCount; i++) {
    results = results.concat(await fn({ ...input, poolId: i }))
  }
  return results
}

export const parsePages = async <T>(
  input: FunctionParameters & { poolId: number; count: number },
  fn: (params: FunctionParameters & { poolId: number; page: number }) => Promise<T[]>,
): Promise<T[]> => {
  let results: T[] = []
  // Calculate number of pages based on total validators and batch size
  const pages = calculatePages(input.count, input.batchSize)
  for (let i = 1; i <= pages; i++) {
    results = results.concat(await fn({ ...input, poolId: input.poolId, page: i }))
  }
  return results
}

export const fetchValidatorsByPool = async (
  params: FunctionParameters & { poolId: number },
): Promise<ValidatorAddress[]> => {
  const nodeRegistryAddress: string = await params.manager.getNodeRegistry(params.poolId, {
    blockTag: params.blockTag,
  })
  const nodeRegistryManager = new ethers.Contract(
    nodeRegistryAddress,
    StaderNodeRegistryContract_ABI,
    params.provider,
  )
  const validatorCount =
    (await nodeRegistryManager.nextValidatorId({ blockTag: params.blockTag })) - 1
  logger.debug(
    `${validatorCount} addresses in pool ${params.poolId}. May not be the number that are active.`,
  )

  return await parsePages(
    { ...params, manager: nodeRegistryManager, poolId: params.poolId, count: validatorCount },
    fetchValidatorsInPage,
  )
}

const fetchValidatorsInPage = async ({
  manager,
  page,
  batchSize,
  blockTag,
  network,
  chainId,
  poolId,
}: FunctionParameters & { poolId: number; page: number }): Promise<ValidatorAddress[]> => {
  const validators = (await manager.getAllActiveValidators(page, batchSize, {
    blockTag,
  })) as validatorsRegistryResponse[]

  return validators.map(([status, pubkey, , , withdrawVaultAddress, operatorId, , ,]) => ({
    address: pubkey,
    withdrawVaultAddress,
    network,
    chainId,
    operatorId: Number(operatorId),
    poolId,
    status,
  }))
}

export const fetchSocialPoolAddressesByPool = async ({
  manager,
  blockTag,
  poolId,
}: FunctionParameters & { poolId: number }): Promise<PoolAddress[]> => {
  const address = await manager.getSocializingPoolAddress(poolId, { blockTag })
  return [{ address, poolId }]
}

export const fetchElRewardAddressesByPage = async ({
  manager,
  page,
  batchSize,
  blockTag,
}: FunctionParameters & {
  page: number
}): Promise<BasicAddress[]> => {
  const addresses = (await manager.getAllSocializingPoolOptOutOperators(page, batchSize, {
    blockTag,
  })) as string[]
  return addresses.map((address) => ({ address }))
}

export const buildErrorResponse = (errorMessage: string): TimestampedProviderErrorResponse => {
  return {
    statusCode: 502,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs: 0,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
