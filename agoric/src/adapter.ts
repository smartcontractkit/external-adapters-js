import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { HTTPSender } from './httpSender';

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

export const getRequiredFee = (value: string | number) => {
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

export const makeExecute: (send: HTTPSender) => Execute = send => async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) {
    throw validator.error
  }

  const jobRunID = validator.validated.id

  const { request_id: queryId, result, payment } = validator.validated.data
  const requiredFee = getRequiredFee(payment)

  await send({
    type: 'oracleServer/reply',
    data: { queryId, reply: result, requiredFee },
  })

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
