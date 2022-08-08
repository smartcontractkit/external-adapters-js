import {
  Config,
  Validator,
  Requester,
  AdapterInputError,
  AdapterDataProviderError,
  util,
  AdapterContext,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'
import { requestSelf } from '../util'

export const supportedEndpoints = ['balance']

export const description =
  'The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof Of Reserves adapter.'

export type TInputParameters = { addresses: Address[]; minConfirmations: number }
export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
  minConfirmations: {
    required: false,
    aliases: ['confirmations'],
    type: 'number',
    default: 0,
    description:
      'Number (integer, min 0, max 64) of blocks that must have been confirmed after the point against which the balance is checked (i.e. balance will be sourced from {latestBlockNumber - minConfirmations}',
  },
}

interface AddressWithBalance {
  address: string
  balance: string
}

type Address = {
  address: string
}

interface ResponseWithResult extends Partial<AxiosResponse> {
  result: AddressWithBalance[]
}

export const execute: ExecuteWithConfig<Config> = async (request, context, _) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]
  // TODO: use?
  // const minConfirmations = validator.validated.data.minConfirmations

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  let balances
  try {
    balances = await Promise.all(
      addresses.map((addr, index) => getBalance(context, `${jobRunID}-${index}`, addr.address)),
    )
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const response = {
    jobRunID,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }

  const result: ResponseWithResult = {
    ...response,
    result: balances,
    data: {
      result: balances,
    },
  }

  return Requester.success(jobRunID, result)
}

const getBalance = async (
  context: AdapterContext,
  id: string,
  address: string,
): Promise<AddressWithBalance> => {
  const validatorRequest = await requestSelf(context, id, {
    endpoint: 'validator',
    stateId: 'finalized',
    validatorId: address,
  })
  const result = validatorRequest.result
  if (!result) throw new Error('Could not retrieve balance') // TODO: improve
  return {
    address,
    balance: result.toString(),
  }
}
