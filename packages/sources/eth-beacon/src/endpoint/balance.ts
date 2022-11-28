import { Config, Validator, Requester, AdapterInputError } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

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

interface ResponseSchema {
  execution_optimistic: false
  data: [
    {
      index: string
      balance: string
    },
  ]
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

  // If a status filter is given,
  // then a different Beacon endpoint needs to be used to retrieve validator status
  if (validatorStatus?.length > 0)
    return await queryWithState(jobRunID, config, stateId, addresses, validatorStatus)

  const url = `/eth/v1/beacon/states/${stateId}/validator_balances?id=${addresses
    .map(({ address }) => address)
    .join(',')}`

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const balances = response.data.data.map((validator) => ({
    address: validator.index,
    balance: validator.balance,
  }))

  const result = {
    ...response,
    data: {
      balances,
      result: balances,
    },
  }

  return Requester.success(jobRunID, result, config.verbose)
}

interface StateResponseSchema {
  execution_optimistic: false
  data: {
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
}

const queryWithState = async (
  jobRunID: string,
  config: Config,
  stateId: string,
  addresses: Address[],
  validatorStatus: string[],
) => {
  const url = `/eth/v1/beacon/states/${stateId}/validators/`

  const responses = await Promise.all(
    addresses.map(async ({ address }) => {
      const options = { ...config.api, url: url + address }
      try {
        return await Requester.request<StateResponseSchema>(options)
      } catch {
        // If address is an invalid validator on the beacon chain, swallow 404 and return a 0 balance
        return {
          data: {
            execution_optimistic: false,
            data: {
              index: '0',
              balance: '0',
              status: 'failed',
              validator: {
                pubkey: address,
                withdrawal_credentials: '',
                effective_balance: '0',
                slashed: false,
                activation_eligibility_epoch: '',
                activation_epoch: '',
                exit_epoch: '',
                withdrawable_epoch: '',
              },
            },
          } as StateResponseSchema,
        }
      }
    }),
  )

  const validators = responses.map(({ data }) => data)
  const filteredValidators = validators.filter((validator) =>
    validatorStatus.includes(validator.data.status),
  )
  const balances = filteredValidators.map(({ data }) => ({
    address: data.validator.pubkey,
    balance: data.balance,
  }))

  const result = {
    data: {
      validators,
      result: balances,
    },
  }

  return Requester.success(jobRunID, result, config.verbose)
}
