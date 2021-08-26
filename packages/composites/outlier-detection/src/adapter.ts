import {
  AdapterRequest,
  AdapterResponse,
  ExecuteFactory,
  ExecuteWithConfig,
  RequestConfig,
  Config,
} from '@chainlink/types'
import { Requester, Validator, util } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import { makeConfig, DEFAULT_CHECK_THRESHOLD, DEFAULT_ONCHAIN_THRESHOLD } from './config'
import { AxiosResponse } from 'axios'

export type SourceRequestOptions = { [source: string]: RequestConfig }
export type CheckRequestOptions = { [check: string]: RequestConfig }

export type AdapterOptions = {
  sources: SourceRequestOptions
  checks: CheckRequestOptions
  api: any
}

const customParams = {
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
  source: true,
  asset: true,
  check: false,
  check_threshold: false,
  onchain_threshold: false,
}

const execute: ExecuteWithConfig<Config> = async (input, _, __) => {
  const paramOptions = makeOptions(input.data.source.split(','), input.data.check.split(','))
  const validator = new Validator(input, customParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const source = validator.validated.data.source.toUpperCase()
  const check = validator.validated.data.check?.toUpperCase()
  const check_threshold = validator.validated.data.check_threshold || DEFAULT_CHECK_THRESHOLD
  const onchain_threshold = validator.validated.data.onchain_threshold || DEFAULT_ONCHAIN_THRESHOLD
  const { referenceContract, multiply } = validator.validated.data

  const onchainValue = await getLatestAnswer(referenceContract, multiply, input.meta)

  const adapterOptions = getAdapterOptions(source.split(','), check.split(','))
  const sourceMedian = await getExecuteMedian(adapterOptions.sources, source, input)

  if (onchain_threshold > 0) {
    if (difference(sourceMedian, onchainValue) > onchain_threshold) {
      return success(jobRunID, onchainValue)
    }
  }

  if (check_threshold > 0) {
    if (!check) {
      throw Error('No check adapters provided')
    }

    const checkMedian = await getExecuteMedian(adapterOptions.checks, check, input)
    if (difference(sourceMedian, checkMedian) > check_threshold) {
      return success(jobRunID, onchainValue)
    }
  }

  return success(jobRunID, sourceMedian)
}

const getAdapterOptions = (
  sourceAdapters: string[],
  checkAdapters: string[],
  prefix = '',
): AdapterOptions => {
  const sources: SourceRequestOptions = {}
  for (const name of sourceAdapters) {
    const url = util.getURL(name.toUpperCase())
    if (url) {
      sources[name] = makeRequestOptions(prefix, url)
    } else {
      throw new Error(`The URL for the ${name} source adapter has not been set yet`)
    }
  }
  const checks: CheckRequestOptions = {}
  for (const name of checkAdapters) {
    const url = util.getURL(name.toUpperCase())
    if (url) {
      checks[name] = makeRequestOptions(prefix, url)
    } else {
      throw new Error(`The URL for the ${name} check adapter has not been set yet`)
    }
  }

  return { sources, checks, api: {} }
}

const makeRequestOptions = (prefix: string, url: string): RequestConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig.api,
    method: 'post',
    url,
  }
}

const makeOptions = (sources: string[], checks: string[]) => {
  return {
    source: util.permutator(
      sources.map((value) => value.toLowerCase()),
      ',',
    ),
    check: util.permutator(
      checks.map((value) => value.toLowerCase()),
      ',',
    ),
  }
}

const getExecuteMedian = async (
  options: SourceRequestOptions | CheckRequestOptions,
  adapters: string,
  request: AdapterRequest,
): Promise<number> => {
  const responses = await Promise.allSettled(
    adapters.split(',').map(
      async (a) =>
        await Requester.request({
          ...options[a],
          data: request,
        }),
    ),
  )
  const values = responses
    .filter((result) => result.status === 'fulfilled' && 'value' in result)
    .map(
      (result) =>
        (result as PromiseFulfilledResult<AxiosResponse<Record<string, any>>>).value.data.result,
    )
  if (values.length === 0) throw Error('Unable to fetch value from any of the data providers')
  return median(values)
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0
  values.sort((a, b) => a - b)
  const half = Math.floor(values.length / 2)
  if (values.length % 2) return values[half]
  return (values[half - 1] + values[half]) / 2.0
}

const difference = (a: number, b: number): number => {
  return (Math.abs(a - b) / ((a + b) / 2)) * 100
}

const success = (jobRunID: string, result: number): AdapterResponse => {
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
