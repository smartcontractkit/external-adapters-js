import {
  AdapterRequest,
  AdapterResponse,
  ExecuteWithConfig,
  InputParameters,
  AxiosRequestConfig,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import { makeOptions, ExtendedConfig } from '../config'
import { AxiosResponse } from 'axios'

export const supportedEndpoints = ['outlier']

export type SourceRequestOptions = { [source: string]: AxiosRequestConfig }
export type CheckRequestOptions = { [check: string]: AxiosRequestConfig }

export type TInputParameters = {
  referenceContract: string
  multiply: number
  source: string
  check?: string
  check_threshold?: number
  onchain_threshold?: number
  network?: string
}

const inputParameters: InputParameters<TInputParameters> = {
  referenceContract: {
    required: true,
    aliases: ['contract'],
    type: 'string',
    description: 'The smart contract to read the reference data value from',
  },
  multiply: {
    required: true,
    type: 'number',
    description: 'The amount to multiply the referenced value',
  },
  source: {
    required: true,
    type: 'string',
    description:
      'The source external adapter to use. Multiple sources can be through a `,` delimiter. (e.g. `xbto,dxfeed`)',
  },
  check: {
    required: false,
    type: 'string',
    description:
      'The check external adapter to use. Multiple checks can be through a `,` delimiter. (e.g. `deribit,dxfeed`). Required if `check_threshold` is used',
  },
  check_threshold: {
    required: false,
    type: 'number',
    description: 'Set a percentage deviation threshold against the check data sources.',
    default: 0,
  },
  onchain_threshold: {
    required: false,
    type: 'number',
    description: 'Set a percentage deviation threshold against the on-chain value. ',
    default: 0,
  },
  network: {
    required: false,
    description: 'The blockchain network to use.',
    default: 'ETHEREUM',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (input, _, config) => {
  const paramOptions = makeOptions(config)
  const validator = new Validator(input, inputParameters, paramOptions)

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source.toUpperCase()
  const check = validator.validated.data.check?.toUpperCase()
  const check_threshold = validator.validated.data.check_threshold as number
  const onchain_threshold = validator.validated.data.onchain_threshold as number
  // TODO: non-nullable default types
  const { referenceContract, multiply } = validator.validated.data
  const network = validator.validated.data.network as string

  const onchainValue = await getLatestAnswer(network, referenceContract, multiply, input.meta)

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
        (result as PromiseFulfilledResult<AxiosResponse<Record<string, number>>>).value.data.result,
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
