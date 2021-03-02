import { BigNumber } from 'ethers'

import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'

import { makeConfig } from './config'

// We're on localhost, so retries just confuse the oracle state.
const NUM_RETRIES = 1

export interface Action {
  type: string
  data: unknown
}

const inputParams = {
  request_id: ['request_id'],
  result: ['result'],
  payment: ['payment'],
}

// FIXME: Ideally, these would be the same.
const LINK_UNIT = BigNumber.from(10).pow(BigNumber.from(18))
const LINK_AGORIC_UNIT = BigNumber.from(10).pow(BigNumber.from(6))

// Convert the payment in $LINK into Agoric's pegged $LINK token.
export const getRequiredFee = (value: string | number): number => {
  const paymentCL = BigNumber.from(value)
  const paymentAgoricLink = paymentCL.mul(LINK_AGORIC_UNIT).div(LINK_UNIT)
  return paymentAgoricLink.toNumber()
}

export interface PostReply {
  ok: boolean
  res?: unknown
  rej?: unknown
}

const executeImpl: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) {
    throw validator.error
  }

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const { request_id: queryId, result, payment } = validator.validated.data
  const requiredFee = getRequiredFee(payment)

  const obj = {
    type: 'oracleServer/reply',
    data: { queryId, reply: result, requiredFee },
  }

  const response = await Requester.request(
    {
      ...config.api,
      method: 'POST',
      data: obj,
    },
    undefined,
    NUM_RETRIES,
  )

  const pr = response.data as PostReply
  if (!pr.ok) {
    throw Error(`${obj.type} response failed: ${pr.rej}`)
  }

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

const tryExecuteLogError = (
  execute: ExecuteWithConfig<Config>,
): ExecuteWithConfig<Config> => async (request, config) => {
  try {
    return await execute(request, config)
  } catch (e) {
    const queryId = request.data?.request_id
    const rest = { queryId }

    await Requester.request(
      {
        ...config.api,
        method: 'POST',
        data: {
          type: 'oracleServer/error',
          data: { error: `${(e && e.message) || e}`, ...(queryId && rest) },
        },
      },
      undefined,
      NUM_RETRIES,
    ).catch((e2: Error) => console.error(`Cannot reflect error to caller:`, e2))

    // See https://github.com/smartcontractkit/external-adapters-js/issues/204
    // for discussion of why this code is necessary.
    if (e instanceof AdapterError) {
      throw e
    }
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 500,
      message: `${(e && e.message) || e}`,
      cause: e,
    })
  }
}

export const execute = tryExecuteLogError(executeImpl)
export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
