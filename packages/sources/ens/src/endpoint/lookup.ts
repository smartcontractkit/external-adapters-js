import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ethers } from 'ethers'
import { initializeENS } from '../utils'

export const description = 'Look up information about a human friendly ENS domain name'

export const supportedEndpoints = ['lookup']
export const endpointResultPaths = {
  lookup: 'address',
}

export const inputParameters: InputParameters = {
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
    throw new AdapterError({
      jobRunID,
      message: `Invalid ENS name. Format must be [domain].[top level domain], (e.g. chainlink.eth)`,
      statusCode: 400,
    })

  const networkProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const contracts = await initializeENS(networkProvider)

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
    const [registrant, controller, address] = await Promise.all<
      string | undefined,
      string,
      string | null
    >([
      isEthTLD && !isSubdomain
        ? await contracts.Registrar.ownerOf(tokenId)
        : new Promise((resolve) => resolve(undefined)),
      await contracts.Registry.owner(namehash),
      await networkProvider.resolveName(name),
    ])

    response.data = {
      registrant,
      controller,
      address: address ?? undefined,
    }
  } catch (error) {
    throw new AdapterError({
      jobRunID,
      message: `Failed to fetch on-chain data.  Error Message: ${error}`,
    })
  }

  const result = response.data[resultPath]

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
