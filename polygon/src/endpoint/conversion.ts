import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'conversion'

const customError = (data: any) => {
  return data.status === 'ERROR'
}

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  amount: false,
  precision: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const endpoint = `conversion`
  const amount = validator.validated.data.amount || 1
  const precision = validator.validated.data.precision || 4
  const apikey = config.apiKey
  const url = `${endpoint}/${from}/${to}`

  const params = {
    amount,
    precision,
    apikey,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['converted'])
  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}
