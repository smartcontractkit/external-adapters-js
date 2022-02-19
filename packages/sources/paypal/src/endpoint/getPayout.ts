import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import * as paypal from '@paypal/payouts-sdk'

export const supportedEndpoints = ['getpayout', 'read']

export const description =
  'Endpoint used to get information about a transaction or batch of transactions.'

export const inputParameters: InputParameters = {
  payout_id: {
    required: true,
    description: 'ID of the payout batch or item to lookup',
    type: 'string',
  },
  type: {
    required: false,
    description: 'Type of payout to lookup',
    options: ['ITEM', 'BATCH'],
    default: 'BATCH',
    type: 'string',
  },
}

const paramOptions = {
  type: ['ITEM', 'BATCH'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, paramOptions)

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
