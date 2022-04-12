import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const description = 'https://api.real-time-attest.trustexplorer.io/chainlink/TrueUSD'

export const inputParameters: InputParameters = {
  field: {
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
  token: { tokenName: string; principle: number }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const field = validator.validated.data.field
  const url = '/chainlink/TrueUSD'

  if (!['totalTrust', 'totalToken'].includes(field)) {
    throw new AdapterError({
      jobRunID,
      message: 'Parameter "resultPath" should be one of ["totalTrust", "totalToken"]',
      statusCode: 400,
    })
  }

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)

  const result = Requester.validateResultNumber(response.data, [field])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
