import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  resultPath: {
    description: 'The data point to return from the API response data',
    options: ['totalTrust', 'totalToken'],
    default: 'totalTrust',
    required: false,
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
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const url = '/trusttoken/TrueUSD'

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options, customError)

  const result = Requester.validateResultNumber(response.data, ['responseData', resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
