import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import * as paypal from '@paypal/payouts-sdk'

export const NAME = 'getpayout'

const customParams = {
  payout_id: true,
  type: false,
}

const paramOptions = {
  type: ['ITEM', 'BATCH'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const payout_id: string = validator.validated.data.payout_id
  const type = validator.validated.data.type || 'BATCH'

  let paypal_req
  switch (type) {
    case 'BATCH':
      paypal_req = new paypal.payouts.PayoutsGetRequest(payout_id)
      break
    case 'ITEM':
      paypal_req = new paypal.payouts.PayoutsItemGetRequest(payout_id)
      break
    default:
      throw new AdapterError({
        jobRunID,
        message: `Payout type ${type} not supported.`,
        statusCode: 400,
      })
  }

  try {
    const response = await config.api.client.execute(paypal_req)
    return Requester.success(jobRunID, { data: response, status: response.statusCode })
  } catch (e) {
    throw Requester.errored(jobRunID, e, e.statusCode)
  }
}
