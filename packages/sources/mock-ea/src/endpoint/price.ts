import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
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
    responseInfo.result =
      now % 2 === 0
        ? responseInfo.result + config.deviationAmount
        : responseInfo.result - config.deviationAmount
    responseInfo.lastUpdated = now
  }
  responseInfo.result = Math.max(config.minResult, responseInfo.result)
  return {
    jobRunID,
    data: { result: responseInfo.result },
    result: responseInfo.result,
    statusCode: 200,
  }
}
