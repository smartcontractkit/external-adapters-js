import { Requester, util, Validator, Logger } from '@chainlink/ea-bootstrap'
import {
  AdapterResponse,
  AdapterRequest,
  ExecuteWithConfig,
  Config,
  ExecuteFactory,
} from '@chainlink/types'
import { makeConfig } from './config'

const customParams = {
  primarySource: true,
  secondarySource: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const primarySource = validator.validated.data.primarySource
  const secondarySource = validator.validated.data.secondarySource
  const sources = secondarySource ? [primarySource, secondarySource] : [primarySource]
  const urls = sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  return getResults(jobRunID, sources, urls, input, config)
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
): Promise<AdapterResponse> => {
  try {
    Logger.info(`Trying to get result from ${sources[0]}`)
    return Requester.success(
      jobRunID,
      await Requester.request({
        ...config.api,
        method: 'post',
        url: urls[0],
        data: request,
      }),
    )
  } catch (e) {
    Logger.info(`Could not get result from ${sources[0]}, trying to get result from ${sources[1]}`)
    return Requester.success(
      jobRunID,
      await Requester.request({
        ...config.api,
        method: 'post',
        url: urls[1],
        data: request,
      }),
    )
  }
}
