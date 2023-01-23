import {
  Config,
  Validator,
  Requester,
  AdapterInputError,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['balance']

export const description =
  'The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof of Reserves adapter.'

export type TInputParameters = { addresses: Address[] }
export const inputParameters: InputParameters<TInputParameters> = {
  addresses: {
    aliases: ['result'],
    required: true,
    type: 'array',
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
  },
}

type Address = {
  address: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses as Address[]

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      statusCode: 400,
    })
  }

  return await queryPlatformChain(jobRunID, config, addresses)
}

interface ResponseSchema {
  result: {
    balance: string
  }
}

interface BalanceResponse {
  addresses: string[]
  balance: string
}

const queryPlatformChain = async (jobRunID: string, config: Config, addresses: Address[]) => {
  const addressList = addresses.map(({ address }) => address)
  const options: AxiosRequestConfig = {
    ...config.api,
    method: 'POST',
    data: {
      jsonrpc: '2.0',
      method: 'platform.getBalance',
      params: { addresses: addressList },
      id: jobRunID,
    },
  }

  const response = await Requester.request<ResponseSchema>(options)
  const balances: BalanceResponse[] = []

  // Balances will only have a single entry that contains the balance for all of the addresses specified in the request
  // The platform.getBalance method only provides the sum so all addresses are grouped in the results
  balances.push({ addresses: addressList, balance: response.data.result.balance })

  const result = {
    data: {
      result: balances,
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}
