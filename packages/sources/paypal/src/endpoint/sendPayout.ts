import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import * as paypal from '@paypal/payouts-sdk'

export const NAME = 'sendpayout'

const customParams = {
  amount: true,
  currency: false,
  receiver: true,
  recipient_type: false,
  note: false,
  sender_item_id: false,
  email_subject: false,
  email_message: false,
}

const paramOptions = {
  recipient_type: ['EMAIL', 'PHONE', 'PAYPAL_ID'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const value: string = validator.validated.data.amount
  const currency: string = validator.validated.data.currency || 'USD'
  const receiver: string = validator.validated.data.receiver
  const recipient_type = validator.validated.data.recipient_type || 'EMAIL'
  const note: string = validator.validated.data.note || ''
  const sender_item_id: string = validator.validated.data.sender_item_id || ''
  const email_subject: string = validator.validated.data.email_subject || ''
  const email_message: string = validator.validated.data.email_message || ''

  const params = {
    sender_batch_header: {
      sender_batch_id: Math.random()
        .toString(36)
        .substring(9),
      email_subject,
      email_message,
      recipient_type,
      note,
    },
    items: [
      {
        amount: {
          value,
          currency,
        },
        receiver,
        sender_item_id,
      },
    ],
  }

  const paypal_req = new paypal.payouts.PayoutsPostRequest()
  paypal_req.requestBody(params)

  let response;
  try {
    response = await config.api.client.execute(paypal_req)
  } catch (e) {
    throw Requester.errored(jobRunID, JSON.parse(e.message))
  }
  return Requester.success(jobRunID, response, config.verbose)
}
