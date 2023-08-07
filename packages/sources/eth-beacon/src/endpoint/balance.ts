import {
  Validator,
  Requester,
  AdapterInputError,
  AxiosRequestConfig,
  AxiosResponse,
  Logger,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { fetchLimboEthBalances, chunkArray, formatValueInGwei } from './utils'
import { ethers } from 'ethers'
import { EthBeaconConfig } from '../config'

export const supportedEndpoints = ['balance']

export const description =
  '**NOTE:** The balance output is given in Gwei!\n\n**NOTE**: The balance query is normally quite slow, ' +
  'no matter how many validators are being queried. API_TIMEOUT has been set to default to 60s.\n\n' +
  'The balance endpoint will fetch the validator balance of each address in the query. If the search limbo validator flag is set to true, it ' +
  'will also fetch balances for validators not found on beacon from deposit events. Adapts the response for the Proof Of Reserves adapter.'

export type TInputParameters = {
  addresses: Address[]
  stateId: string
  validatorStatus?: string[]
  searchLimboValidators: boolean
}
export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
  stateId: {
    required: false,
    type: 'string',
    description: 'The beacon chain state ID to query',
    default: 'finalized',
  },
  validatorStatus: {
    required: false,
    type: 'array',
    description: 'A filter to apply validators by their status',
  },
  searchLimboValidators: {
    type: 'boolean',
    description:
      'Flag to determine if deposit events need to be searched for limbo validators. Only set to true if using an archive node.',
    default: false,
    required: false,
  },
}

export type Address = {
  address: string
}

export const execute: ExecuteWithConfig<EthBeaconConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  return await queryInBatches(jobRunID, config, validator.validated.data)
}

interface StateResponseSchema {
  execution_optimistic: false
  data: ValidatorState[]
}

interface ValidatorState {
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

export interface BalanceResponse {
  address: string
  balance: string
}

const queryInBatches = async (
  jobRunID: string,
  config: EthBeaconConfig,
  params: {
    stateId: string
    addresses: Address[]
    validatorStatus?: string[]
    searchLimboValidators?: boolean
  },
) => {
  const url = `/eth/v1/beacon/states/${params.stateId}/validators`
  const statusList = params.validatorStatus?.join(',')
  const batchSize = config.adapterSpecificParams.batchSize
  const responses: AxiosResponse<StateResponseSchema>[] = []
  // If adapter configured with 0 batch size, put all validators in one request to allow skipping batching
  if (batchSize === 0) {
    const addresses = params.addresses.map(({ address }) => address).join(',')
    responses.push(await queryBeaconChain(config, url, addresses, statusList))
  } else {
    const batchedAddresses = []
    // Separate the address set into the specified batch size
    // Add the batches as comma-separated lists to a new list used to make the requests
    for (let i = 0; i < params.addresses.length / batchSize; i++) {
      batchedAddresses.push(
        params.addresses
          .slice(i * batchSize, i * batchSize + batchSize)
          .map(({ address }) => address)
          .join(','),
      )
    }

    const groupSize = config.adapterSpecificParams.groupSize
    const requestGroups = chunkArray(batchedAddresses, groupSize)

    // Make request to beacon API for every batch
    // Send requests in groups
    for (const group of requestGroups) {
      responses.push(
        ...(await Promise.all(
          group.map((addresses) => {
            return queryBeaconChain(config, url, addresses, statusList)
          }),
        )),
      )
    }
  }

  // Flatten the results into single array for validators and balances
  const validatorBatches = responses.map(({ data }) => data)
  const balances: BalanceResponse[] = []
  const validators: ValidatorState[] = []
  validatorBatches.forEach(({ data }) => {
    data.forEach((validator) => {
      validators.push(validator)
      balances.push({
        address: validator.validator.pubkey,
        balance: validator.balance,
      })
    })
  })

  // Get validators not found on the beacon chain
  const unfoundValidators = params.addresses.filter(
    ({ address }) => !balances.find((balance) => balance.address === address),
  )

  // If searchLimboValidators param set to true, search deposit events for validators not found on the beacon chain
  // Otherwise, record 0 for the balance of missing validators
  if (params.searchLimboValidators) {
    balances.push(...(await searchLimboValidators(config, unfoundValidators)))
  } else {
    // Populate balances list with addresses that were filtered out with a 0 balance
    // Prevents empty array being returned which would ultimately fail at the reduce step
    // Keep validators list as is to maintain the response received from consensus client
    unfoundValidators.forEach(({ address }) => {
      balances.push({
        address,
        balance: '0',
      })
    })
  }

  const result = {
    data: {
      validators,
      result: balances,
    },
  }

  return Requester.success(jobRunID, result, config.verbose)
}

const queryBeaconChain = async (
  config: EthBeaconConfig,
  url: string,
  addresses: string,
  statusList?: string,
): Promise<AxiosResponse<StateResponseSchema>> => {
  const options: AxiosRequestConfig = {
    ...config.api,
    url,
    params: { id: addresses, status: statusList },
  }
  return Requester.request<StateResponseSchema>(options)
}

const searchLimboValidators = async (
  config: EthBeaconConfig,
  unfoundValidators: Address[],
): Promise<BalanceResponse[]> => {
  const balances: BalanceResponse[] = []
  // ETH EL RPC URL is an optional env var since this is an optional feature
  // Check if env var is set before doing search
  if (!config.adapterSpecificParams.executionRpcUrl) {
    const message =
      'ETH_EXECUTION_RPC_URL env var must be set to perform limbo validator search. Please use an archive node.'
    Logger.error(message)
    throw new AdapterInputError({
      statusCode: 400,
      message,
    })
  } else {
    const limboAddressMap: Record<string, Address> = {}
    // Parse unfound validators into a map for easier access in limbo search
    unfoundValidators.forEach((validator) => {
      limboAddressMap[validator.address.toLowerCase()] = validator
    })

    const provider = new ethers.providers.JsonRpcProvider(
      config.adapterSpecificParams.executionRpcUrl,
      config.adapterSpecificParams.chainId,
    )

    // Returns map of validators found in limbo with balances in wei
    const limboBalances = await fetchLimboEthBalances(
      limboAddressMap,
      String(config.adapterSpecificParams?.beaconRpcUrl),
      provider,
    )

    unfoundValidators.forEach((validator) => {
      const limboBalance = limboBalances[validator.address.toLowerCase()]
      if (limboBalance) {
        balances.push({
          address: validator.address,
          balance: formatValueInGwei(limboBalance),
        })
      } else {
        balances.push({
          address: validator.address,
          balance: '0',
        })
      }
    })

    return balances
  }
}
