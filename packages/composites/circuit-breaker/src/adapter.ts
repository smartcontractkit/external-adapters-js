import { AdapterError, Requester, util, Validator, Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest, ExecuteWithConfig, Config, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { AxiosResponse } from 'axios'

const customParams = {
  primarySource: true,
  secondarySource: true,
}

export interface ResponseSchema {
  result: any
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const primarySource = validator.validated.data.primarySource
  const secondarySource = validator.validated.data.secondarySource
  const sources = secondarySource ? [primarySource, secondarySource] : [primarySource]
  const urls = sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const response = await getResults(jobRunID, sources, urls, input, config)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'result'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const getResults = async (
  jobRunID: string,
  sources: string[],
  urls: string[],
  request: AdapterRequest,
  config: Config,
): Promise<AxiosResponse<ResponseSchema>> => {
  try {
    Logger.info(`Trying to get result from ${sources[0]}`)
    return await Requester.request<ResponseSchema>({
      ...config.api,
      method: 'post',
      url: urls[0],
      data: request,
    })
  } catch (e) {
    if (!sources[1]) {
      Logger.info(`The second source is undefined, please set a correct value`)
      throw new AdapterError({
        jobRunID,
        message: `The second source is undefined`,
        statusCode: 400,
      })
    }
    Logger.info(`Could not get result from ${sources[0]}, trying to get result from ${sources[1]}`)
    return await Requester.request<ResponseSchema>({
      ...config.api,
      method: 'post',
      url: urls[1],
      data: request,
    })
  }
}
