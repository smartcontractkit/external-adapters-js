import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

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

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `MCO2`
  const resultPath = validator.validated.data.resultPath

  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
