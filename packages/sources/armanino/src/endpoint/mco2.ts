import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['mco2', 'balance']

export const endpointResultPaths = {
  mco2: 'totalMCO2',
  balance: 'totalMCO2',
}

export interface ResponseSchema {
  totalMCO2: number
  totalCarbonCredits: number
  timestamp: string
}

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `MCO2`
  const resultPath = validator.validated.data.resultPath

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [resultPath as string])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
