import { Execute } from '@chainlink/types'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { HTTPSender, HTTPSenderReply } from './httpSender'

const customParams = {
  request_id: ['request_id'],
  result: ['result'],
  payment: ['payment'],
}

const Nat = (n: number) => {
  if (!Number.isSafeInteger(n)) {
    throw Error(`${n} is not a safe integer`)
  }
  return n
}

// FIXME: Ideally, these would be the same.
const LINK_DECIMALS = 18
const LINK_AGORIC_DECIMALS = 6
if (LINK_AGORIC_DECIMALS > LINK_DECIMALS) {
  throw Error(
    `LINK_AGORIC_DECIMALS ${LINK_AGORIC_DECIMALS} must be less than or equal to ${LINK_DECIMALS}`,
  )
}

export const getRequiredFee = (value: string | number): number => {
  const str = String(value || 0)
  const digits = str
  const significant = digits.substr(
    0,
    Math.max(0, digits.length - (LINK_DECIMALS - LINK_AGORIC_DECIMALS)),
  )

  const roundUp = digits[significant.length] && parseInt(digits[significant.length], 10) >= 5
  let requiredFee = Nat(parseInt(significant || '0', 10))
  if (roundUp) {
    requiredFee += 1
  }
  return Nat(requiredFee)
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

export const makeExecute: (send: HTTPSender) => Execute = (send) => async (input) => {
  try {
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
  } catch (e) {
    console.error(`Agoric adapter error:`, e)
    send({
      type: 'oracleServer/error',
      data: { queryId: input.data && input.data.request_id, error: `${(e && e.message) || e}` },
    }).catch((e2) => console.error(`Cannot reflect error to caller:`, e2))

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
