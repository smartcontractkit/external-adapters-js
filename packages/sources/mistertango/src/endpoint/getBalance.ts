import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { makeSignature } from '../adapter'

export const NAME = 'getbalance' // This should be filled in with a lowercase name corresponding to the API endpoint

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  date: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date || ''

  const url = '/transaction/getBalance'

  const data = {
    username: config.api.apiUser,
    date,
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
