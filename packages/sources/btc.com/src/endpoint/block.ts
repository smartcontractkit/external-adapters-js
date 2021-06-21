import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const supportedEndpoints = ['height', 'difficulty']

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

const customParams = {
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  request.data.field = validator.validated.data.endpoint || config.DEFAULT_ENDPOINT
  const field = validator.validated.data.field || 'difficulty'
  const url = `/v3/block/latest`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)

  response.data.result = Requester.validateResultNumber(response.data as ResponseSchema, [
    'data',
    field,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
