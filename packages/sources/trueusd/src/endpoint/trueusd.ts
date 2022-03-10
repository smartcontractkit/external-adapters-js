import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const endpointResultPaths = {
  trueusd: 'totalTrust',
}

const customError = (data: ResponseSchema) => !data.success

export const description = 'https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD'

export const inputParameters: InputParameters = {
  resultPath: {
    required: false,
    description:
      'The object-path string to parse a single `result` value. When not provided the entire response will be provided.',
    type: 'string',
  },
}

interface ResponseSchema {
  responseData: {
    accountName: string
    totalTrust: number
    totalToken: number
    updatedAt: string
    token: { tokenName: string; principle: number }[]
  }
  message: { msg: string }[]
  success: boolean
  responseCode: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const url = '/trusttoken/TrueUSD'

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options, customError)

  const result = Requester.validateResultNumber(response.data, ['responseData', resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
