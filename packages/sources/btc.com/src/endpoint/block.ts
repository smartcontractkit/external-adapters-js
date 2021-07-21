import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters, EndpointResultPaths } from '@chainlink/types'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths: EndpointResultPaths = {
  height: 'height',
  difficulty: 'difficulty',
}

export interface ResponseSchema {
  data: {
    height: number
    version: number
    mrkl_root: string
    timestamp: number
    bits: number
    nonce: number
    hash: string
    prev_block_hash: string
    next_block_hash: string
    size: number
    pool_difficulty: number
    difficulty: number
    difficulty_double: number
    tx_count: number
    reward_block: number
    reward_fees: number
    confirmations: number
    is_orphan: boolean
    curr_max_timestamp: number
    is_sw_block: boolean
    stripped_size: number
    sigops: number
    weight: number
    extras: { pool_name: string; pool_link: string }
  }

  err_code: number
  err_no: number
  message: string
  status: string
}

export const inputParameters: InputParameters = {
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const url = `/v3/block/latest`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)

  response.data.result = Requester.validateResultNumber(response.data as ResponseSchema, [
    'data',
    resultPath,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
