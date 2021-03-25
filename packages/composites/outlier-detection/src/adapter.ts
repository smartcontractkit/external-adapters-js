import {
  AdapterRequest,
  AdapterResponse,
  ExecuteFactory,
  ExecuteWithConfig,
} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import {
  Config,
  makeConfig,
  makeOptions,
  DEFAULT_CHECK_THRESHOLD,
  DEFAULT_ONCHAIN_THRESHOLD,
  SourceRequestOptions,
  CheckRequestOptions,
} from './config'
import { AxiosResponse } from 'axios'

const customParams = {
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
  source: true,
  asset: true,
  check: false,
  check_threshold: false,
  onchain_threshold: false,
}

const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const paramOptions = makeOptions(config)
  const validator = new Validator(input, customParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const source = validator.validated.data.source.toUpperCase()
  const check = validator.validated.data.check?.toUpperCase()
  const check_threshold = validator.validated.data.check_threshold || DEFAULT_CHECK_THRESHOLD
  const onchain_threshold = validator.validated.data.onchain_threshold || DEFAULT_ONCHAIN_THRESHOLD
  const { referenceContract, multiply } = validator.validated.data

  const onchainValue = await getLatestAnswer(referenceContract, multiply, input.meta)

  const sourceMedian = await getExecuteMedian(config.sources, source, input)

  if (onchain_threshold > 0) {
    if (difference(sourceMedian, onchainValue) > onchain_threshold) {
      return success(jobRunID, onchainValue)
    }
  }

  if (check_threshold > 0) {
    if (!check) {
      throw Error('No check adapters provided')
    }

    const checkMedian = await getExecuteMedian(config.checks, check, input)
    if (difference(sourceMedian, checkMedian) > check_threshold) {
      return success(jobRunID, onchainValue)
    }
  }

  return success(jobRunID, sourceMedian)
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
  return async (request) => execute(request, config || makeConfig())
}
