import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const endpointResultPaths = {
  trueusd: 'totalTrust',
}

const customError = (data: ResponseSchema) => !data.success

export const description = 'https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD'

export const inputParameters: InputParameters = {}

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

  const response = await HTTP.request<ResponseSchema>(options, customError)

  const result = HTTP.validateResultNumber(response.data, ['responseData', resultPath])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
