import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import * as paypal from '@paypal/payouts-sdk'
import { CreatePayoutRequestBody, RecipientType } from '@paypal/payouts-sdk'

export const supportedEndpoints = ['sendpayout', 'write']

export const customParams = {
  recipient_type: ['EMAIL', 'PHONE', 'PAYPAL_ID'],
}

export const description = 'Endpoint used to send currency to a specified receiver.'

export type TInputParameters = {
  amount: string
  currency: string
  receiver: string
  recipient_type: string
  note: string
  sender_item_id: string
  email_subject: string
  email_message: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  amount: {
    required: true,
    description: 'Amount to send as a string',
    type: 'string',
  },
  currency: {
    required: false,
    description:
      'Three-character ISO-4217 currency code. [options](https://developer.paypal.com/docs/api/reference/currency-codes/)',
    default: 'USD',
    type: 'string',
  },
  receiver: {
    required: true,
    description: 'Specified receiver matching the `recipient_type`',
    type: 'string',
  },
  recipient_type: {
    required: false,
    description: 'The type of `receiver`',
    options: ['EMAIL', 'PHONE', 'PAYPAL_ID'],
    default: 'EMAIL',
    type: 'string',
  },
  note: {
    required: false,
    description: 'Custom note for payout',
    type: 'string',
  },
  sender_item_id: {
    required: false,
    description: 'Custom sender-specified ID for payout',
    type: 'string',
  },
  email_subject: {
    required: false,
    description: 'Custom email subject for the payment notification',
    type: 'string',
  },
  email_message: {
    required: false,
    description: 'Custom email message for the payment notification',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, customParams)

  const jobRunID = validator.validated.id
  const value: string = validator.validated.data.amount
  const currency: string = validator.validated.data.currency || 'USD'
  const receiver: string = validator.validated.data.receiver
  const recipient_type: RecipientType = (
    validator.validated.data.recipient_type || 'EMAIL'
  ).toUpperCase() as RecipientType
  const note: string = validator.validated.data.note || ''
  const sender_item_id: string = validator.validated.data.sender_item_id || ''
  const email_subject: string = validator.validated.data.email_subject || ''
  const email_message: string = validator.validated.data.email_message || ''

  const params: CreatePayoutRequestBody = {
    sender_batch_header: {
      sender_batch_id: Math.random().toString(36).substring(9),
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

  try {
    const response = await (config.api as any).client.execute(paypal_req)
    return Requester.success(jobRunID, { data: response, status: response.statusCode })
  } catch (e: any) {
    const error = e as AdapterError
    throw Requester.errored(jobRunID, error, error.statusCode)
  }
}
