import { AdapterInputError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const NAME = 'trueusd'

export const supportedEndpoints = ['trueusd']

export const description = 'https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD'

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

interface ResponseSchema {
  accountName: string
  totalTrust: number
  totalToken: number
  updatedAt: string
  token: { tokenName: string; principle: number }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = (validator.validated.data.resultPath || '').toString()
  const url = '/trusttoken/TrueUSD'

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
