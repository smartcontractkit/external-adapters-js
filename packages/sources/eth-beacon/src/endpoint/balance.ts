import {
  Config,
  Validator,
  Requester,
  AdapterInputError,
  AxiosRequestConfig,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { DEFAULT_BATCH_SIZE, DEFAULT_GROUP_SIZE } from '../config'

export const supportedEndpoints = ['balance']

export const description =
  '**NOTE:** The balance output is given in Gwei!\n\n**NOTE**: The balance query is normally quite slow, no matter how many validators are being queried. API_TIMEOUT has been set to default to 60s.\n\nThe balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof Of Reserves adapter.'

export type TInputParameters = { addresses: Address[]; stateId: string; validatorStatus: string[] }
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
}

type Address = {
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]
  const stateId = validator.validated.data.stateId
  const validatorStatus = validator.validated.data.validatorStatus

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  return await queryInBatches(jobRunID, config, stateId, addresses, validatorStatus)
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

interface BalanceResponse {
  address: string
  balance: string
}

const queryInBatches = async (
  jobRunID: string,
  config: Config,
  stateId: string,
  addresses: Address[],
  validatorStatus: string[],
) => {
  const url = `/eth/v1/beacon/states/${stateId}/validators`
  const statusList = validatorStatus?.join(',')
  const batchSize = Number(config.adapterSpecificParams?.batchSize) || DEFAULT_BATCH_SIZE
  const batchedAddresses = []
  // Separate the address set into the specified batch size
  // Add the batches as comma-separated lists to a new list used to make the requests
  for (let i = 0; i < addresses.length / batchSize; i++) {
    batchedAddresses.push(
      addresses
        .slice(i * batchSize, i * batchSize + batchSize)
        .map(({ address }) => address)
        .join(','),
    )
  }

  const requestGroups = chunkArray(
    batchedAddresses,
    Number(config.adapterSpecificParams?.groupSize) || DEFAULT_GROUP_SIZE,
  )

  const responses: AxiosResponse<StateResponseSchema>[] = []
  // Make request to beacon API for every batch
  // Send requests in groups
  for (const group of requestGroups) {
    responses.push(
      ...(await Promise.all(
        group.map((addresses) => {
          const options: AxiosRequestConfig = {
            ...config.api,
            url,
            params: { id: addresses, status: statusList },
          }
          return Requester.request<StateResponseSchema>(options)
        }),
      )),
    )
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

  // Populate balances list with addresses that were filtered out with a 0 balance
  // Prevents empty array being returned which would ultimately fail at the reduce step
  // Keep validators list as is to maintain the response received from consensus client
  addresses
    .filter(({ address }) => !balances.find((balance) => balance.address === address))
    .forEach(({ address }) => {
      balances.push({
        address,
        balance: '0',
      })
    })

  const result = {
    data: {
      validators,
      result: balances,
    },
  }

  return Requester.success(jobRunID, result, config.verbose)
}

const chunkArray = <T>(addresses: T[], size: number): T[][] =>
  addresses.length > size
    ? [addresses.slice(0, size), ...chunkArray(addresses.slice(size), size)]
    : [addresses]
