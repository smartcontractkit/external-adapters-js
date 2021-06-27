import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { makeSignature } from '../adapter'

export const NAME = 'sendmoney' // This should be filled in with a lowercase name corresponding to the API endpoint

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  amount: true,
  recipient: false,
  account: true,
  details: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const amount = validator.validated.data.amount
  const currency = 'EUR' //only one currency is available
  const recipient = validator.validated.data.recipient.replace(' ', '_') || ''
  const account = validator.validated.data.account
  const details = validator.validated.data.details

  const url = '/transaction/sendMoney'

  const data = {
    username: config.api.apiUser,
    amount,
    currency,
    recipient,
    account,
    details,
  }

  const signature = makeSignature(
    config.api.apiSecret,
    config.api.headers['X-API-NONCE'],
    data,
    url,
  )
  config.api.headers = {
    ...config.api.headers,
    'X-API-SIGN': signature,
  }

  const options = { ...config.api, data, url }

  const response = await Requester.request(options, customError)

  return Requester.success(jobRunID, response, config.verbose)
}
