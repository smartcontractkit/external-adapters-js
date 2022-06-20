import {
  Requester,
  Validator,
  AdapterError,
  AdapterInputError,
  AdapterDataProviderError,
  AdapterConnectionError,
  util,
} from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { initializeENS } from '../utils'

export const description = 'Look up information about a human friendly ENS domain name'

export const supportedEndpoints = ['lookup']
export const endpointResultPaths = {
  lookup: 'address',
}

export type TInputParameters = { ensName: string }
export const inputParameters: InputParameters<TInputParameters> = {
  ensName: {
    description: 'The ENS name to look up',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const name = validator.validated.data.ensName.toLowerCase()
  const resultPath = validator.validated.data.resultPath

  const splitName = name.split('.')
  if (splitName.length < 2)
    throw new AdapterInputError({
      jobRunID,
      message: `Invalid ENS name. Format must be [domain].[top level domain], (e.g. chainlink.eth)`,
      statusCode: 400,
    })

  const networkProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  let contracts
  try {
    contracts = await initializeENS(networkProvider)
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
  const response = {
    data: {} as Record<string, string | undefined>,
    status: 200,
    statusText: '',
    headers: {},
    config: {},
  }

  try {
    const isEthTLD = splitName[splitName.length - 1] === 'eth'
    const isSubdomain = splitName.length > 2
    const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(splitName[0]))
    const tokenId = ethers.BigNumber.from(labelHash).toString()
    const namehash = ethers.utils.namehash(name)
    const [registrant, controller, address] = await Promise.all([
      isEthTLD && !isSubdomain
        ? ((await contracts.Registrar.ownerOf(tokenId)) as string)
        : new Promise<undefined>((resolve) => resolve(undefined)),
      await contracts.Registry.owner(namehash),
      (await networkProvider.resolveName(name)) as string | null,
    ])

    response.data = {
      registrant,
      controller,
      address: address ?? undefined,
    }
  } catch (e) {
    const error = e as any
    const errorPayload = {
      jobRunID,
      message: `Failed to fetch on-chain data.  Error Message: ${error}`,
    }
    throw error.response
      ? new AdapterDataProviderError(errorPayload)
      : error.request
      ? new AdapterConnectionError(errorPayload)
      : new AdapterError(errorPayload)
  }

  const result = response.data[resultPath as string]

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
