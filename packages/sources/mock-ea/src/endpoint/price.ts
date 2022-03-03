import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ExtendedConfig } from '../config'

export const supportedEndpoints = ['price']

export interface ResponseSchema {
  data: {
    price: number
  }
}

export const inputParameters: InputParameters = {}

interface ResponseInfo {
  result: number
  lastUpdated?: number
}

const responseInfo: ResponseInfo = {
  result: 1000,
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const lastUpdated = responseInfo.lastUpdated
  const now = Date.now()
  if (!lastUpdated || now - lastUpdated >= config.updateIntervalInMS) {
    const amountToDeviate = (config.deviationAmount * responseInfo.result) / 100
    responseInfo.result =
      now % 2 === 0 ? responseInfo.result + amountToDeviate : responseInfo.result - amountToDeviate
    responseInfo.lastUpdated = now
  }
  return {
    jobRunID,
    data: { result: responseInfo.result },
    result: responseInfo.result,
    statusCode: 200,
  }
}
