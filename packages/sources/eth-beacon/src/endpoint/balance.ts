import {
  Config,
  Validator,
  Requester,
  AdapterInputError,
  AdapterDataProviderError,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['balance']

export const description =
  '**NOTE:** The balance output is given in Gwei!\n\n**NOTE**: The balance query is normally quite slow, no matter how many validators are being queried. API_TIMEOUT has been set to default to 60s.\n\nThe balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof Of Reserves adapter.'

export type TInputParameters = { addresses: Address[]; stateId: string }
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

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  const url = `/eth/v1/beacon/states/${stateId}/validator_balances?${addresses
    .map((a) => `id=${a.address}`)
    .join('&')}`

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const balances = response.data.data.map((validator) => ({
    address: validator.index,
    balance: validator.balance,
  }))
  if (balances.length != addresses.length) {
    throw new AdapterDataProviderError({
      jobRunID,
      message: `Beacon node did not return the right amount of balances.`,
    })
  }
  const result = {
    ...response,
    data: {
      balances,
      result: balances,
    },
  }

  return Requester.success(jobRunID, result, config.verbose)
}
