import { Requester, util, Validator, Logger } from '@chainlink/ea-bootstrap'
import {
  AdapterRequest,
  AdapterResponse,
  ExecuteWithConfig,
  Config,
  ExecuteFactory,
  RequestConfig,
} from '@chainlink/types'
// import { AxiosResponse } from 'axios'
import { makeConfig } from './config'

export type SourceRequestOptions = { [source: string]: RequestConfig }

export type AdapterOptions = {
  sources: SourceRequestOptions
}

const customParams = {
  sources: true,
  days: ['days', 'period', 'result', 'key'],
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const sources = parseSources(validator.validated.data.sources)
  const urls = sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  return getResults(jobRunID, sources, urls, input, config)
}

export const parseSources = (sources: string | string[]): string[] => {
  if (Array.isArray(sources)) {
    return sources
  }
  return sources.split(',')
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
  let response
  try {
    Logger.info(`Trying to make an conection with ${sources[0]}`)
    response = await Requester.request({
      ...config.api,
      method: 'post',
      url: urls[0],
      data: request,
    })
  } catch (error) {
    Logger.info(`We could not connect to ${sources}, trying to make an conection with ${urls[1]}`)
    response = await Requester.request({
      ...config.api,
      method: 'post',
      url: urls[1],
      data: request,
    })
  }
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'result'])
  return Requester.success(jobRunID, response)
}
