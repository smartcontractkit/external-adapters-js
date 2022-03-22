import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, ExecuteWithConfig, Config, RequestConfig } from '@chainlink/types'
import { AxiosResponse } from 'axios'

export const supportedEndpoints = ['medianizer']

export type SourceRequestOptions = { [source: string]: RequestConfig }

const inputParameters = {
  sources: true,
  minAnswers: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.jobRunID
  const sources = parseSources(validator.validated.data.sources)
  const minAnswers = validator.validated.data.minAnswers || 1

  const urls = sources.map((source) => util.getRequiredURL(source.toUpperCase()))
  const result = await getExecuteMedian(urls, input, minAnswers, config)

  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}

export const parseSources = (sources: string | string[]): string[] => {
  if (Array.isArray(sources)) {
    return sources
  }
  return sources.split(',')
}

const getExecuteMedian = async (
  urls: string[],
  request: AdapterRequest,
  minAnswers: number,
  config: Config,
): Promise<number> => {
  const responses = await Promise.allSettled(
    urls.map(
      async (url) =>
        await Requester.request({
          ...config.api,
          method: 'post',
          url,
          data: request,
        }),
    ),
  )
  const values = responses
    .filter((result) => result.status === 'fulfilled' && 'value' in result)
    .map(
      (result) =>
        (result as PromiseFulfilledResult<AxiosResponse<Record<string, number>>>).value.data.result,
    )
  if (values.length < minAnswers)
    throw Error(
      `Not returning median: got ${values.length} answers, requiring min. ${minAnswers} answers`,
    )
  return median(values)
}

export const median = (values: number[]): number => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}
