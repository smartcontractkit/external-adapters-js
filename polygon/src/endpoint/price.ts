import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'

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
  const amount = validator.validated.data.amount || 1
  const precision = validator.validated.data.precision || 4
  const url = `last/crypto/${from}/${to}`

  const params = {
    ...config.api.params,
    amount,
    precision,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, ['last','price'])
  return Requester.success(jobRunID, {
    data: {result},
    status: 200,
  })
}
