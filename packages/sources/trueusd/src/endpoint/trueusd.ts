import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'trueusd'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  resultPath: false,
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
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath || 'totalTrust'
  const url = '/trusttoken/TrueUSD'

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options, customError)

  const result = Requester.validateResultNumber(response.data, ['responseData', resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
