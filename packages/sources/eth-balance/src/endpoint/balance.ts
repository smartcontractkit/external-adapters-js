import {
  Validator,
  Requester,
  AdapterInputError,
  AdapterDataProviderError,
  util,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { ethers } from 'ethers'

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
      'An array of addresses to get the balances of (as an object with string `address` as an attribute). Optionally includes a `chainId` attribute to select RPC provider by chain ID.',
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
  chainId?: string
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

  // verify chainId is present in all addresses or none
  const chainIds = addresses.map((address) => address.chainId).filter(Boolean)
  if (chainIds.length != addresses.length && chainIds.length != 0) {
    throw new AdapterInputError({
      jobRunID,
      message: `'chainId' must be present or absent across all addresses.`,
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

  const providerSet = new Set<ethers.providers.Provider>()
  const addressProviders = []
  for (const address of addresses) {
    let provider
    if (address.chainId && !isNaN(Number(address.chainId))) {
      provider = config.chainIdToProviderMap.get(address.chainId)
    } else {
      provider = config.provider
    }
    if (!provider) {
      throw new AdapterInputError({
        jobRunID,
        message: `Missing provider mapping for chainId ${address.chainId}.`,
        statusCode: 400,
      })
    }
    providerSet.add(provider)
    addressProviders.push({ address: address.address, provider })
  }

  const providerBlockTags = new Map<ethers.providers.Provider, number | string>()
  if (minConfirmations !== 0) {
    const providerBlockTagRequests = Array.from(providerSet).map((provider) =>
      provider.getBlockNumber().then((result) => {
        const targetBlockTag = result - minConfirmations
        providerBlockTags.set(provider, targetBlockTag)
      }),
    )
    await Promise.all(providerBlockTagRequests)
  }

  let balances
  try {
    balances = await Promise.all(
      addressProviders.map((address) => {
        const targetBlockTag = providerBlockTags.get(address.provider) || 'latest'
        return getBalance(address.address, targetBlockTag, address.provider)
      }),
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
    data: {},
    config: {},
  }

  const result: ResponseWithResult = {
    ...(response as Omit<AxiosResponse, 'config'>),
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
  provider: ethers.providers.Provider,
): Promise<AddressWithBalance> => ({
  address,
  balance: (await provider.getBalance(address, targetBlockTag)).toString(),
})
