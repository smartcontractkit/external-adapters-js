import { Validator, Requester, AdapterInputError, AdapterDataProviderError,
  util, } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'
import { Config } from '../config'

export const supportedEndpoints = ['balance']

export const description =
  'The balance endpoint will fetch the balance of each address in the query.'

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]
  const minConfirmations = validator.validated.data.minConfirmations

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  // The limitation of 64 is to make it work with both full and light/fast sync nodes
  if (!Number.isInteger(minConfirmations) || minConfirmations < 0 || minConfirmations > 64) {
    throw new AdapterInputError({
      jobRunID,
      message: `Min confirmations must be an integer between 0 and 64`,
      statusCode: 400,
    })
  }

  let targetBlockTag: string | number = 'latest'
  if (minConfirmations !== 0) {
    const lastBlockNumber = await config.provider.getBlockNumber()
    targetBlockTag = lastBlockNumber - minConfirmations
  }

  let balances
  try {
    balances = await Promise.all(
      addresses.map((addr) => getBalance(addr.address, targetBlockTag, config)),
    )
  } catch (e) {
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
  address: string,
  targetBlockTag: string | number,
  config: Config,
): Promise<AddressWithBalance> => ({
  address,
  balance: (await config.provider.getBalance(address, targetBlockTag)).toString(),
})
