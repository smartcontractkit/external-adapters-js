import {
  AdapterDataProviderError,
  AdapterInputError,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const endpointResultPaths = {
  trueusd: 'totalTrust',
}

export const description =
  'https://api.real-time-attest.trustexplorer.io/chainlink/proof-of-reserves/TrueUSD'

export type TInputParameters = {
  field?: string // Deprecated - kept for backwards compatability
  chain?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  chain: {
    required: false,
    description: 'Filter data to a single blockchain',
    type: 'string',
  },
  field: {
    // Deprecated - kept for backwards compatability
    required: false,
    default: 'totalTrust',
    description:
      'The object-path string to parse a single `result` value. When not provided the entire response will be provided.',
    type: 'string',
  },
}

interface ResponseSchema {
  accountName: string
  totalTrust: number
  totalToken: number
  updatedAt: string
  token: {
    tokenName: string
    principle: number
    totalTokenByChain: number
    totalTrustByChain: number
    bankBalances: {
      [name: string]: number
    }
  }[]
  ripcord: boolean
  ripcordDetails: string[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const field = validator.validated.data.field
  const chain = validator.validated.data.chain
  const resultPath = (validator.validated.data.resultPath || field || '').toString()
  const url = '/chainlink/proof-of-reserves/TrueUSD'

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)

  // Return error if ripcord indicator true
  if (response.data.ripcord) {
    const message = `Ripcord indicator true. Details: ${response.data.ripcordDetails.join(', ')}`
    throw new AdapterDataProviderError({
      message,
      statusCode: 502,
      errorResponse: {
        ripcord: response.data.ripcord,
        ripcordDetails: response.data.ripcordDetails,
      },
    })
  }

  if (chain) {
    const chainData = response.data.token.find(({ tokenName }) => tokenName.includes(chain))
    if (!chainData) {
      const options = response.data.token.map(({ tokenName }) => tokenName).join(', ')
      throw new AdapterInputError({
        jobRunID,
        message: `The given "chain" parameter of ${chain} is not found. Available options are one of: ${options}`,
        statusCode: 400,
      })
    }

    const resultPathOverride = // If 'resultPath' is default, then override to default for chain data
      resultPath === endpointResultPaths.trueusd ? 'totalTrustByChain' : resultPath
    const result = Requester.validateResultNumber(chainData, [resultPathOverride])
    return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
  }

  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
