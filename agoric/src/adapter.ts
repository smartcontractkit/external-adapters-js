import BN from 'bn.js'

import { Execute } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { HTTPSender, HTTPSenderReply } from './httpSender'

const customParams = {
  request_id: ['request_id'],
  result: ['result'],
  payment: ['payment'],
}

// FIXME: Ideally, these would be the same.
const LINK_UNIT = new BN(10).pow(new BN(18))
const LINK_AGORIC_UNIT = new BN(10).pow(new BN(6))

// Convert the payment in $LINK into Agoric's pegged $LINK token.
export const getRequiredFee = (value: string | number): number => {
  const paymentCL = new BN(value)
  const paymentAgoricLink = paymentCL.mul(LINK_AGORIC_UNIT).div(LINK_UNIT)
  return paymentAgoricLink.toNumber()
}

export interface PostReply {
  ok: boolean
  res?: unknown
  rej?: unknown
}

export const assertGoodReply = (sentType: string, reply: HTTPSenderReply): void => {
  if (reply.status < 200 || reply.status >= 300) {
    throw Error(`${sentType} status ${reply.status} is not 2xx`)
  }

  const pr = reply.response as PostReply
  if (!pr.ok) {
    throw Error(`${sentType} response failed: ${pr.rej}`)
  }
}

const makeRawExecute = (send: HTTPSender): Execute => async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) {
    throw validator.error
  }

  const jobRunID = validator.validated.id

  const { request_id: queryId, result, payment } = validator.validated.data
  const requiredFee = getRequiredFee(payment)

  const obj = {
    type: 'oracleServer/reply',
    data: { queryId, reply: result, requiredFee },
  }
  const reply = await send(obj)

  assertGoodReply(obj.type, reply)

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

const tryExecuteLogError = (send: HTTPSender, execute: Execute): Execute => async (input) => {
  try {
    return await execute(input)
  } catch (e) {
    const queryId = input.data?.request_id
    const rest = { queryId }
    await send({
      type: 'oracleServer/error',
      data: { error: `${(e && e.message) || e}`, ...(queryId && rest) },
    }).catch((e2) => console.error(`Cannot reflect error to caller:`, e2))

    // See https://github.com/smartcontractkit/external-adapters-js/issues/204
    // for discussion of why this code is necessary.
    if (e instanceof AdapterError) {
      throw e
    }
    throw new AdapterError({
      jobRunID: input.id,
      statusCode: 500,
      message: `${(e && e.message) || e}`,
      cause: e,
    })
  }
}

export const makeExecute = (send: HTTPSender): Execute =>
  tryExecuteLogError(send, makeRawExecute(send))
