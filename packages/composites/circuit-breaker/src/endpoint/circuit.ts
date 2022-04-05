import { Requester, util, Validator, Logger } from '@chainlink/ea-bootstrap'
import {
  Config,
  AdapterResponse,
  AdapterRequest,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'

export const supportedEndpoints = ['circuit']

const inputParameters: InputParameters = {
  primarySource: {
    required: true,
    description: 'First source adapters to query',
  },
  secondarySource: {
    required: true,
    description: 'Second source adapter to query',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.jobRunID
  const primarySource = validator.validated.data.primarySource
  const secondarySource = validator.validated.data.secondarySource
  const sources = secondarySource ? [primarySource, secondarySource] : [primarySource]
  const urls = sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  return getResults(jobRunID, sources, urls, request, config)
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
