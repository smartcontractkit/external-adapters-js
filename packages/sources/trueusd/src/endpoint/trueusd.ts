import { AdapterInputError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const description = 'https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD'

export type TInputParameters = {
  field?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
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
  const resultPath = (validator.validated.data.resultPath || field || '').toString()
  const url = '/chainlink/TrueUSD'

  if (!['totalTrust', 'totalToken'].includes(resultPath)) {
    throw new AdapterInputError({
      jobRunID,
      message: 'Parameter "resultPath" should be one of ["totalTrust", "totalToken"]',
      statusCode: 400,
    })
  }

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)

  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
