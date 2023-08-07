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
  network: string
}

const assetIdMap: Record<string, string> = {
  avalanche: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
  'avalanche-fuji': 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
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
  jsonrpc: string
  result: {
    staked: string
    stakeds: Record<string, string>
    stakedOutputs: string[]
    encoding: string
  }
  id: number
}

interface BalanceResponse {
  addresses: string[]
  balance: string
}

const queryPlatformChain = async (jobRunID: string, config: Config, addresses: Address[]) => {
  const network = addresses[0].network
  const assetId = assetIdMap[network]
  const addressList = addresses.map(({ address }) => address)
  const options: AxiosRequestConfig = {
    ...config.api,
    method: 'POST',
    data: {
      jsonrpc: '2.0',
      method: 'platform.getStake',
      params: { addresses: addressList },
      id: jobRunID,
    },
  }

  const response = await Requester.request<ResponseSchema>(options)
  const balances: BalanceResponse[] = []

  // The "stakeds" field will aggregate the staked value across all addresses by asset ID
  // Only need to report the staked value for AVAX
  const stakedValue = response.data.result.stakeds[assetId] || '0'
  balances.push({ addresses: addressList, balance: stakedValue })

  const result = {
    data: {
      result: balances,
    },
  }
  return Requester.success(jobRunID, result, config.verbose)
}
